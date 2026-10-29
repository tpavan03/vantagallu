import type {
  FunctionCall,
  LiveConnectConfig,
  LiveServerMessage,
  Session,
} from "@google/genai";
import type {
  CookingCommand,
  CookingSession,
  VoiceStatus,
} from "../domain/types";
import { api, ApiError } from "./api";
import { deviceId } from "./cache";

export interface VoiceControllerOptions {
  getSession: () => CookingSession | null;
  onSession: (session: CookingSession) => void;
  onStatus: (status: VoiceStatus) => void;
  onTranscript: (text: string) => void;
  onError: (message: string) => void;
}
export interface VoiceController {
  start: () => Promise<void>;
  stop: () => void;
  updateContext: (session: CookingSession) => void;
  dispose: () => void;
}
interface Lease {
  id: string;
  deviceId: string;
  expiresAt: string;
  epoch: number;
}
type LiveTransport = Pick<
  Session,
  "sendClientContent" | "sendRealtimeInput" | "sendToolResponse" | "close"
>;
interface Token {
  apiVersion?: string;
  token: string;
  model: string;
  expiresAt: string;
  newSessionExpireTime: string;
  revision: number;
  config: LiveConnectConfig;
}
interface ContextWindow extends Window {
  webkitAudioContext?: typeof AudioContext;
}

export function pcm16ToFloat32(bytes: Uint8Array): Float32Array {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const result = new Float32Array(Math.floor(bytes.byteLength / 2));
  for (let i = 0; i < result.length; i++)
    result[i] = view.getInt16(i * 2, true) / 32768;
  return result;
}
export function pcmBytesToBase64(bytes: Uint8Array): string {
  let value = "";
  for (let i = 0; i < bytes.length; i += 8192)
    value += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(value);
}
function decodeBase64(value: string) {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}
async function stableId(value: string) {
  const bytes = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return [...new Uint8Array(bytes)]
    .slice(0, 20)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
function contextSnapshot(session: CookingSession) {
  return JSON.stringify({
    sessionId: session.id,
    revision: session.revision,
    language: session.language,
    servings: session.servings,
    cookware: session.cookware,
    currentStepId: session.currentStepId,
    completedStepIds: session.completedStepIds,
    addedIngredients: session.addedIngredients,
    extraIngredients: session.extraIngredients,
    adaptations: session.adaptations.slice(-12),
    timers: session.timers,
    remainingSteps: session.steps.filter(
      (step) => !session.completedStepIds.includes(step.id),
    ),
    recentMessages: session.messages.slice(-12),
  });
}

export function createVoiceController(
  options: VoiceControllerOptions,
): VoiceController {
  let desired = false,
    disposed = false,
    generation = 0,
    connectionGeneration = 0;
  let live: LiveTransport | null = null,
    pendingSocket: WebSocket | null = null,
    audio: AudioContext | null = null,
    microphone: MediaStream | null = null;
  let input: MediaStreamAudioSourceNode | null = null,
    capture: AudioWorkletNode | null = null,
    silent: GainNode | null = null;
  let lease: Lease | null = null,
    sessionId: string | null = null,
    selectedLanguage: string | null = null;
  let leaseInterval: ReturnType<typeof setInterval> | null = null,
    reconnectTimer: ReturnType<typeof setTimeout> | null = null,
    expiryTimer: ReturnType<typeof setTimeout> | null = null;
  let reconnectAttempts = 0,
    resumptionHandle: string | undefined,
    nextPlayback = 0;
  let inputText = "",
    outputText = "",
    playbackDiscarded = false,
    generating = false,
    inputSequence = 0,
    outputSequence = 0,
    lastContextRevision = -1;
  const callNonce = crypto.randomUUID(),
    sources = new Set<AudioBufferSourceNode>();
  const cancelledTools = new Set<string>(),
    toolResults = new Map<string, Promise<Record<string, unknown>>>();
  const requests = new Set<AbortController>();
  let writes: Promise<unknown> = Promise.resolve();
  let connectPending = false;
  let leaseRelease: Promise<unknown> = Promise.resolve();

  const valid = (epoch: number) => desired && !disposed && epoch === generation;
  function report(status: VoiceStatus) {
    if (!disposed) options.onStatus(status);
  }
  function publish(session: CookingSession) {
    const current = options.getSession();
    if (session.id === sessionId)
      lastContextRevision = Math.max(lastContextRevision, session.revision);
    if (current?.id === session.id && session.revision >= current.revision)
      options.onSession(session);
  }
  function stopPlayback() {
    sources.forEach((source) => {
      try {
        source.stop();
      } catch {
        /* already ended */
      }
      source.disconnect();
    });
    sources.clear();
    nextPlayback = audio?.currentTime || 0;
  }
  function clearConnection() {
    connectionGeneration++;
    if (expiryTimer) clearTimeout(expiryTimer);
    expiryTimer = null;
    const previous = live;
    live = null;
    const pending = pendingSocket;
    pendingSocket = null;
    if (pending) {
      try {
        pending.close();
      } catch {
        /* not open */
      }
    }
    try {
      previous?.close();
    } catch {
      /* already closed */
    }
    stopPlayback();
  }
  function cleanupAudio() {
    capture?.port.postMessage({ type: "stop" });
    capture?.port.close();
    capture?.disconnect();
    input?.disconnect();
    silent?.disconnect();
    capture = null;
    input = null;
    silent = null;
    microphone?.getTracks().forEach((track) => track.stop());
    microphone = null;
    const context = audio;
    audio = null;
    if (context && context.state !== "closed")
      void context.close().catch(() => undefined);
  }
  async function request<T>(path: string, body?: unknown) {
    const controller = new AbortController();
    requests.add(controller);
    const timeout = setTimeout(() => controller.abort(), 18000);
    try {
      return await api<T>(path, body, controller.signal);
    } finally {
      clearTimeout(timeout);
      requests.delete(controller);
    }
  }
  function fail(error: unknown) {
    const raw =
      error instanceof Error
        ? error.message
        : "Voice stopped. Your saved cooking session is still available.";
    const message = /auth_tokens|wss:|AIza|access_token|key=/i.test(raw)
      ? "Voice could not connect. Check the voice setup and try again."
      : error instanceof DOMException && error.name === "NotAllowedError"
        ? "Allow microphone access to use voice. Your saved recipe is still available."
        : raw;
    stop();
    if (!disposed) {
      options.onError(message);
      report("error");
    }
  }
  function stop() {
    const previousLease = lease,
      previousId = sessionId;
    desired = false;
    generation++;
    reconnectAttempts = 0;
    resumptionHandle = undefined;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    if (leaseInterval) clearInterval(leaseInterval);
    reconnectTimer = null;
    leaseInterval = null;
    requests.forEach((controller) => controller.abort());
    requests.clear();
    clearConnection();
    cleanupAudio();
    lease = null;
    sessionId = null;
    selectedLanguage = null;
    connectPending = false;
    inputText = "";
    outputText = "";
    generating = false;
    playbackDiscarded = false;
    options.onTranscript("");
    report("idle");
    if (previousLease && previousId) {
      let releaseDeadline: ReturnType<typeof setTimeout> | undefined;
      const deadline = new Promise((resolve) => {
        releaseDeadline = setTimeout(resolve, 30000);
      });
      leaseRelease = Promise.race([writes.catch(() => undefined), deadline])
        .then(() =>
          api(
            "/voice/lease",
            {
              sessionId: previousId,
              deviceId: previousLease.deviceId,
              leaseId: previousLease.id,
              action: "release",
            },
            AbortSignal.timeout(10000),
          ),
        )
        .catch(() => undefined)
        .finally(() => {
          if (releaseDeadline) clearTimeout(releaseDeadline);
        });
    }
  }
  function enqueueWrite<T>(work: () => Promise<T>): Promise<T> {
    const task = writes.catch(() => undefined).then(work);
    writes = task.catch(() => undefined);
    return task;
  }
  async function canonicalState(id: string) {
    const result = await request<{ session: CookingSession }>(
      `/sessions/${encodeURIComponent(id)}`,
    );
    publish(result.session);
    return result.session;
  }
  function saveTranscript(
    role: "user" | "assistant",
    text: string,
    index: number,
  ) {
    const id = sessionId,
      currentLease = lease;
    if (!id || !currentLease || !text.trim()) return;
    const messageId = `voice-${callNonce}-${index}-${role}`;
    void enqueueWrite(async () => {
      // Finalized text only. Never persist raw microphone chunks or interim transcripts.
      let state = (
        await api<{ session: CookingSession }>(
          `/sessions/${encodeURIComponent(id)}`,
          undefined,
          AbortSignal.timeout(15000),
        )
      ).session;
      if (state.messages.some((message) => message.id === messageId)) return;
      const command: CookingCommand = {
        type: "add_message",
        message: {
          id: messageId,
          role,
          text: text.trim().slice(0, 12000),
          channel: "voice",
          createdAt: new Date().toISOString(),
        },
      };
      const body = {
        commandId: messageId,
        expectedRevision: state.revision,
        command,
        voiceLeaseId: currentLease.id,
      };
      try {
        state = (
          await api<{ session: CookingSession }>(
            `/sessions/${encodeURIComponent(id)}/commands`,
            body,
            AbortSignal.timeout(15000),
          )
        ).session;
      } catch (error) {
        if (
          !(error instanceof ApiError) ||
          error.status !== 409 ||
          !error.session
        )
          throw error;
        // A transcript is append-only; retry the identical message ID against the current revision.
        state = (
          await api<{ session: CookingSession }>(
            `/sessions/${encodeURIComponent(id)}/commands`,
            { ...body, expectedRevision: error.session.revision },
            AbortSignal.timeout(15000),
          )
        ).session;
      }
      publish(state);
    }).catch(() => {
      if (desired && !disposed)
        options.onError(
          "The last voice transcript could not be saved. Your confirmed cooking steps remain saved.",
        );
    });
  }
  function flushTurn(interrupted = false) {
    if (inputText.trim()) saveTranscript("user", inputText, inputSequence++);
    if (!interrupted && !playbackDiscarded && outputText.trim())
      saveTranscript("assistant", outputText, outputSequence++);
    inputText = "";
    outputText = "";
    playbackDiscarded = false;
    generating = false;

    options.onTranscript("");
  }
  function appendTranscript(current: string, incoming: string) {
    return incoming.startsWith(current) ? incoming : current + incoming;
  }

  async function tool(call: FunctionCall, epoch: number, socketEpoch: number) {
    const id = sessionId,
      currentLease = lease,
      callId = call.id;
    if (
      !id ||
      !currentLease ||
      !valid(epoch) ||
      cancelledTools.has(callId || "")
    )
      return;
    const run = async (): Promise<Record<string, unknown>> => {
      if (!valid(epoch) || cancelledTools.has(callId || ""))
        return { cancelled: true };
      if (call.name === "get_cooking_state")
        return { session: await canonicalState(id) };
      if (call.name !== "apply_cooking_command")
        return { error: "This cooking tool is unavailable." };
      if (!callId)
        return {
          error:
            "A tool call ID is required before a confirmed cooking change can be applied.",
        };
      const args = call.args as
        { expectedRevision?: unknown; command?: CookingCommand } | undefined;
      if (!Number.isInteger(args?.expectedRevision) || !args?.command)
        return {
          error:
            "Read the current state and supply its exact expectedRevision and a cooking command.",
        };
      const commandId = `voice-tool-${await stableId(`${id}:${callId}`)}`;
      if (!valid(epoch) || cancelledTools.has(callId))
        return { cancelled: true };
      try {
        const result = await request<{
          session: CookingSession;
          replayed?: boolean;
        }>(`/sessions/${encodeURIComponent(id)}/commands`, {
          commandId,
          expectedRevision: args.expectedRevision,
          command: args.command,
          voiceLeaseId: currentLease.id,
        });
        publish(result.session);
        return result;
      } catch (error) {
        if (error instanceof ApiError && error.session) {
          publish(error.session);
          return {
            error: error.message,
            code: error.code,
            session: error.session,
            action:
              "Reconsider the latest state. Do not blindly repeat an incremental ingredient action.",
          };
        }
        return {
          error:
            error instanceof Error
              ? error.message
              : "The confirmed change was not saved. Read the current cooking state before continuing.",
        };
      }
    };
    let result = callId ? toolResults.get(callId) : undefined;
    if (!result) {
      result = enqueueWrite(run);
      if (callId) {
        toolResults.set(callId, result);
        if (toolResults.size > 64)
          toolResults.delete(toolResults.keys().next().value!);
      }
    }
    const response = await result;
    if (
      valid(epoch) &&
      socketEpoch === connectionGeneration &&
      !cancelledTools.has(callId || "")
    )
      live?.sendToolResponse({
        functionResponses: [{ id: callId, name: call.name, response }],
      });
  }
  function play(
    data: string,
    mimeType: string,
    epoch: number,
    socketEpoch: number,
  ) {
    if (
      !audio ||
      !valid(epoch) ||
      socketEpoch !== connectionGeneration ||
      playbackDiscarded
    )
      return;
    generating = true;
    const samples = pcm16ToFloat32(decodeBase64(data));
    if (!samples.length) return;
    const rate = Number(mimeType.match(/rate=(\d+)/)?.[1]) || 24000;
    const buffer = audio.createBuffer(1, samples.length, rate);
    buffer.copyToChannel(new Float32Array(samples), 0);
    if (nextPlayback - audio.currentTime > 12) {
      stopPlayback();
      options.onError(
        "Voice playback fell behind. The queued reply was cleared; you can ask again.",
      );
      return;
    }
    const source = audio.createBufferSource();
    source.buffer = buffer;
    source.connect(audio.destination);
    sources.add(source);
    source.onended = () => {
      sources.delete(source);
      source.disconnect();
      if (
        !sources.size &&
        valid(epoch) &&
        socketEpoch === connectionGeneration &&
        live
      )
        report("listening");
    };
    nextPlayback = Math.max(nextPlayback, audio.currentTime + 0.015);
    source.start(nextPlayback);
    nextPlayback += buffer.duration;
    report("speaking");
  }
  function reconnect(epoch: number) {
    if (!valid(epoch) || connectPending || reconnectTimer) return;
    if (reconnectAttempts >= 3) {
      fail(
        new Error(
          "Voice disconnected repeatedly. Your cooking session is saved. Tap Retry voice to reconnect.",
        ),
      );
      return;
    }
    clearConnection();
    report("reconnecting");
    const delay = Math.min(4000, 500 * 2 ** reconnectAttempts++);
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      void connect(epoch).catch((error) => {
        if (valid(epoch)) {
          if (
            error instanceof ApiError &&
            [401, 403, 409, 429].includes(error.status)
          )
            fail(error);
          else {
            resumptionHandle = undefined;
            reconnect(epoch);
          }
        }
      });
    }, delay);
  }
  async function receive(
    message: LiveServerMessage,
    epoch: number,
    socketEpoch: number,
  ) {
    if (!valid(epoch) || socketEpoch !== connectionGeneration) return;
    if (
      message.sessionResumptionUpdate?.resumable &&
      message.sessionResumptionUpdate.newHandle
    )
      resumptionHandle = message.sessionResumptionUpdate.newHandle;
    for (const id of message.toolCallCancellation?.ids || [])
      cancelledTools.add(id);
    for (const call of message.toolCall?.functionCalls || [])
      void tool(call, epoch, socketEpoch).catch((error) => {
        if (valid(epoch)) fail(error);
      });
    const content = message.serverContent;
    if (content?.interrupted) {
      stopPlayback();
      outputText = "";
      playbackDiscarded = false;
      generating = false;
      report("listening");
    }
    if (content?.inputTranscription?.text) {
      inputText = appendTranscript(inputText, content.inputTranscription.text);
      options.onTranscript(inputText);
      if (content.inputTranscription.finished) {
        saveTranscript("user", inputText, inputSequence++);
        inputText = "";
        options.onTranscript("");
      }
      if (!sources.size) report("listening");
    }
    if (content?.interimInputTranscription?.text) {
      options.onTranscript(content.interimInputTranscription.text);
      stopPlayback();
      report("listening");
    }
    if (content?.outputTranscription?.text) {
      generating = true;
      outputText = appendTranscript(
        outputText,
        content.outputTranscription.text,
      );
    }
    for (const part of content?.interrupted
      ? []
      : content?.modelTurn?.parts || [])
      if (
        part.inlineData?.data &&
        part.inlineData.mimeType?.startsWith("audio/pcm")
      )
        play(
          part.inlineData.data,
          part.inlineData.mimeType,
          epoch,
          socketEpoch,
        );
    if (content?.turnComplete) {
      flushTurn(!!content.interrupted);
      reconnectAttempts = 0;
      if (!sources.size) report("listening");
    }
    if (message.goAway) reconnect(epoch);
  }
  async function connect(epoch: number) {
    if (!valid(epoch) || !sessionId || !lease) return;
    connectPending = true;
    const socketEpoch = ++connectionGeneration;
    const id = sessionId;
    try {
      const latest = await canonicalState(id);
      if (!valid(epoch) || socketEpoch !== connectionGeneration) return;
      const token = await request<Token>("/voice/token", {
        sessionId: id,
        leaseId: lease.id,
        requestId: crypto.randomUUID(),
      });
      if (!valid(epoch) || socketEpoch !== connectionGeneration) return;
      // The browser owns the pending socket so Stop/timeout closes it even before setupComplete.
      // Google protocol: https://ai.google.dev/gemini-api/docs/live-api/get-started-websocket
      const socket = await new Promise<LiveTransport>((resolve, reject) => {
        const version = token.apiVersion || "v1beta";
        const ws = new WebSocket(
          `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.${version}.GenerativeService.BidiGenerateContentConstrained?access_token=${encodeURIComponent(token.token)}`,
        );
        ws.binaryType = "arraybuffer";
        pendingSocket = ws;
        let settled = false;
        let inbox: Promise<void> = Promise.resolve();
        const timeout = setTimeout(() => {
          if (!settled) {
            settled = true;
            reject(
              new Error("Voice did not finish connecting. Please try again."),
            );
            ws.close();
          }
        }, 15000);
        const send = (value: unknown) => {
          if (ws.readyState !== WebSocket.OPEN)
            throw new Error("Voice is disconnected.");
          ws.send(JSON.stringify(value));
        };
        const transport: LiveTransport = {
          sendRealtimeInput(value) {
            if (ws.bufferedAmount > 65536)
              throw new Error(
                "The voice connection is falling behind. Reconnect when the network is stable.",
              );
            send({ realtimeInput: value });
          },
          sendClientContent(value) {
            send({ clientContent: value });
          },
          sendToolResponse(value) {
            send({
              toolResponse: {
                functionResponses: Array.isArray(value.functionResponses)
                  ? value.functionResponses
                  : [value.functionResponses],
              },
            });
          },
          close() {
            clearTimeout(timeout);
            if (!settled) {
              settled = true;
              reject(new Error("Voice connection stopped."));
            }
            ws.close();
          },
        };
        ws.onopen = () => {
          if (!valid(epoch) || socketEpoch !== connectionGeneration) {
            transport.close();
            return;
          }
          send({
            setup: {
              model: token.model.startsWith("models/")
                ? token.model
                : `models/${token.model}`,
              generationConfig: {
                responseModalities: token.config.responseModalities || [
                  "AUDIO",
                ],
              },
              sessionResumption: resumptionHandle
                ? { handle: resumptionHandle }
                : {},
            },
          });
        };
        ws.onmessage = (event) => {
          inbox = inbox
            .then(async () => {
              const raw =
                typeof event.data === "string"
                  ? event.data
                  : event.data instanceof Blob
                    ? await event.data.text()
                    : new TextDecoder().decode(event.data);
              const message = JSON.parse(raw) as LiveServerMessage;
              if (message.setupComplete && !settled) {
                settled = true;
                clearTimeout(timeout);
                if (pendingSocket === ws) pendingSocket = null;
                resolve(transport);
              }
              await receive(message, epoch, socketEpoch);
            })
            .catch((error) => {
              if (!settled) {
                settled = true;
                clearTimeout(timeout);
                reject(error);
              } else if (valid(epoch)) fail(error);
            });
        };
        ws.onerror = () => {
          if (!settled) {
            settled = true;
            clearTimeout(timeout);
            reject(
              new Error(
                "The voice service could not connect. Please try again.",
              ),
            );
          }
        };
        ws.onclose = (event) => {
          clearTimeout(timeout);
          if (pendingSocket === ws) pendingSocket = null;
          if (!settled) {
            settled = true;
            reject(
              new Error(
                "The voice service rejected this connection. Check the configured model and reconnect.",
              ),
            );
            return;
          }
          if (valid(epoch) && socketEpoch === connectionGeneration) {
            if ([1008, 4001, 4003].includes(event.code))
              fail(
                new Error(
                  "The voice service rejected this connection. Check the configured model and reconnect.",
                ),
              );
            else reconnect(epoch);
          }
        };
      });
      if (!valid(epoch) || socketEpoch !== connectionGeneration) {
        socket.close();
        return;
      }
      live = socket;
      selectedLanguage = latest.language;
      lastContextRevision = latest.revision;
      playbackDiscarded = false;
      report("listening");
      // Supply saved state without asking for an unsolicited spoken response.
      socket.sendClientContent({
        turns: [
          {
            role: "user",
            parts: [
              {
                text: `Current confirmed cooking context. This is a state update, not a request for a reply. Wait for the cook to speak.\n${contextSnapshot(latest)}`,
              },
            ],
          },
        ],
        turnComplete: false,
      });
      if (expiryTimer) clearTimeout(expiryTimer);
      const duration = Math.max(
        1000,
        Date.parse(token.expiresAt) - Date.now() - 10000,
      );
      expiryTimer = setTimeout(() => reconnect(epoch), duration);
    } catch (error) {
      if (valid(epoch) && socketEpoch === connectionGeneration) throw error;
    } finally {
      if (socketEpoch === connectionGeneration) connectPending = false;
    }
  }
  async function start() {
    if (disposed) throw new Error("The voice controller has been closed.");
    if (desired) return;
    const session = options.getSession();
    if (!session?.ownerId)
      throw new Error(
        "Sign in and save this cooking session before starting voice.",
      );
    if (!navigator.onLine)
      throw new Error(
        "Voice needs an internet connection. Your saved recipe is still available.",
      );
    const Audio =
      window.AudioContext || (window as ContextWindow).webkitAudioContext;
    if (
      !Audio ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof AudioWorkletNode === "undefined"
    )
      throw new Error(
        "This browser cannot start live kitchen audio. Use current Chrome or Safari over HTTPS, or keep cooking with text.",
      );
    desired = true;
    const epoch = ++generation;
    sessionId = session.id;
    report("connecting");
    options.onError("");
    try {
      // Invoke both inside the initiating user gesture, before any network await (Safari).
      const context = new Audio({ latencyHint: "interactive" });
      audio = context;
      const resumed = context.resume();
      void resumed.catch(() => undefined);
      const streamRequested = navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });
      const stream = await streamRequested;
      if (!valid(epoch)) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      microphone = stream;
      await resumed;
      await context.audioWorklet.addModule("/audio/pcm-capture.js");
      if (!valid(epoch)) return;
      input = context.createMediaStreamSource(stream);
      capture = new AudioWorkletNode(context, "vantagallu-pcm-capture", {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        outputChannelCount: [1],
      });
      silent = context.createGain();
      silent.gain.value = 0;
      input.connect(capture);
      capture.connect(silent);
      silent.connect(context.destination);
      capture.port.onmessage = (event) => {
        if (!valid(epoch) || !live || event.data?.type !== "pcm") return;
        const buffer = event.data.buffer as ArrayBuffer;
        try {
          live.sendRealtimeInput({
            audio: {
              data: pcmBytesToBase64(new Uint8Array(buffer)),
              mimeType: "audio/pcm;rate=16000",
            },
          });
        } catch (error) {
          if (valid(epoch)) fail(error);
        }
      };
      stream.getTracks().forEach((track) => {
        track.onended = () => {
          if (valid(epoch))
            fail(
              new Error(
                "Microphone access ended. Your cooking state remains saved.",
              ),
            );
        };
      });
      await leaseRelease;
      if (!valid(epoch)) return;
      const result = await request<{ lease: Lease | null }>("/voice/lease", {
        sessionId: session.id,
        deviceId: deviceId(),
        action: "acquire",
      });
      if (!valid(epoch)) {
        if (result.lease)
          void api("/voice/lease", {
            sessionId: session.id,
            deviceId: result.lease.deviceId,
            leaseId: result.lease.id,
            action: "release",
          }).catch(() => undefined);
        return;
      }
      if (!result.lease)
        throw new Error("A voice lease could not be acquired.");
      lease = result.lease;
      leaseInterval = setInterval(() => {
        const current = lease;
        if (valid(epoch) && current)
          void request<{ lease: Lease | null }>("/voice/lease", {
            sessionId: session.id,
            deviceId: current.deviceId,
            leaseId: current.id,
            action: "renew",
          })
            .then((result) => {
              if (valid(epoch)) {
                if (!result.lease) throw new Error("Voice ownership expired.");
                lease = result.lease;
              }
            })
            .catch((error) => {
              if (valid(epoch)) fail(error);
            });
      }, 20000);
      await connect(epoch);
    } catch (error) {
      if (valid(epoch)) {
        fail(error);
        throw error;
      }
    }
  }
  function updateContext(session: CookingSession) {
    if (!desired) return;
    if (session.id !== sessionId) {
      stop();
      return;
    }
    if (session.language !== selectedLanguage && selectedLanguage) {
      resumptionHandle = undefined;
      clearConnection();
      void connect(generation).catch(fail);
      return;
    }
    if (live && session.revision !== lastContextRevision) {
      lastContextRevision = session.revision;
      const staleTurn = generating || sources.size > 0;
      stopPlayback();
      playbackDiscarded = staleTurn;
      try {
        live.sendClientContent({
          turns: [
            {
              role: "user",
              parts: [
                {
                  text: `Confirmed cooking state changed. Discard speech about an older state, use this revision, and wait for the cook; do not answer this state update.\n${contextSnapshot(session)}`,
                },
              ],
            },
          ],
          turnComplete: false,
        });
      } catch (error) {
        fail(error);
      }
    }
  }
  const onHidden = () => {
    if (document.visibilityState === "hidden") stop();
  };
  const onOffline = () => {
    if (desired) {
      stop();
      options.onError(
        "Voice paused while offline. The cooking session is kept on this device.",
      );
    }
  };
  document.addEventListener("visibilitychange", onHidden);
  window.addEventListener("pagehide", stop);
  window.addEventListener("offline", onOffline);
  return {
    start,
    stop,
    updateContext,
    dispose() {
      stop();
      disposed = true;
      document.removeEventListener("visibilitychange", onHidden);
      window.removeEventListener("pagehide", stop);
      window.removeEventListener("offline", onOffline);
    },
  };
}

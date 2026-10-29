import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import {
  createVoiceController,
  pcm16ToFloat32,
  pcmBytesToBase64,
} from "./voice";
import type { VoiceController } from "./voice";
import type { CookingSession, VoiceStatus } from "../domain/types";
import { createCookingSession } from "../domain/session";
import { recipeCatalog } from "../data/recipes";

const { apiMock } = vi.hoisted(() => ({ apiMock: vi.fn() }));
vi.mock("./api", () => ({
  api: apiMock,
  ApiError: class ApiError extends Error {
    status = 500;
    code = "";
    session?: CookingSession;
  },
}));
vi.mock("./cache", () => ({ deviceId: () => "voice-unit-test-device" }));

class FakeSocket {
  static OPEN = 1;
  static instances: FakeSocket[] = [];
  readyState = 0;
  bufferedAmount = 0;
  binaryType = "blob";
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: unknown }) => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: ((event: { code: number }) => void) | null = null;
  send = vi.fn();
  close = vi.fn(() => {
    this.readyState = 3;
    queueMicrotask(() => this.onclose?.({ code: 1000 }));
  });
  url: string;
  constructor(url: string) {
    this.url = url;
    FakeSocket.instances.push(this);
  }
  open() {
    this.readyState = 1;
    this.onopen?.();
  }
  message(value: unknown) {
    this.onmessage?.({
      data: new TextEncoder().encode(JSON.stringify(value)).buffer,
    });
  }
}
class FakeAudio {
  static instances: FakeAudio[] = [];
  currentTime = 0;
  state = "running";
  destination = {};
  audioWorklet = { addModule: vi.fn(async () => undefined) };
  resume = vi.fn(async () => undefined);
  close = vi.fn(async () => {
    this.state = "closed";
  });
  source = { connect: vi.fn(), disconnect: vi.fn() };
  gain = { gain: { value: 1 }, connect: vi.fn(), disconnect: vi.fn() };
  createMediaStreamSource() {
    return this.source;
  }
  createGain() {
    return this.gain;
  }
  createBuffer(_channels: number, samples: number, rate: number) {
    return { duration: samples / rate, copyToChannel: vi.fn() };
  }
  createBufferSource() {
    return {
      buffer: null,
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      onended: null,
    };
  }
  constructor() {
    FakeAudio.instances.push(this);
  }
}
class FakeWorklet {
  static instances: FakeWorklet[] = [];
  port = {
    onmessage: null as null | ((event: { data: unknown }) => void),
    postMessage: vi.fn(),
    close: vi.fn(),
  };
  connect = vi.fn();
  disconnect = vi.fn();
  constructor() {
    FakeWorklet.instances.push(this);
  }
}
const flush = async () => {
  for (let i = 0; i < 50; i++) await Promise.resolve();
};
let state: CookingSession;
let doc: EventTarget & { visibilityState: string };
let win: EventTarget & { AudioContext: typeof FakeAudio };
let track: { stop: ReturnType<typeof vi.fn>; onended: null | (() => void) };
let controllers: VoiceController[];
let leaseCount: number;
let events: {
  status: Mock<(status: VoiceStatus) => void>;
  transcript: Mock<(text: string) => void>;
  error: Mock<(message: string) => void>;
  session: Mock<(session: CookingSession) => void>;
};

function response(path: string, body?: Record<string, unknown>) {
  if (path === "/voice/lease")
    return {
      lease:
        body?.action === "release"
          ? null
          : {
              id: `lease-${++leaseCount}`,
              deviceId: "voice-unit-test-device",
              epoch: leaseCount,
              expiresAt: new Date(Date.now() + 60000).toISOString(),
            },
    };
  if (path === "/voice/token")
    return {
      token: "auth_tokens/unit-fixture",
      model: "gemini-3.8-live",
      expiresAt: new Date(Date.now() + 300000).toISOString(),
      revision: state.revision,
      config: { responseModalities: ["AUDIO"] },
    };
  return { session: state };
}
function controller() {
  const value = createVoiceController({
    getSession: () => state,
    onSession: events.session,
    onStatus: events.status,
    onTranscript: events.transcript,
    onError: events.error,
  });
  controllers.push(value);
  return value;
}
async function connected(value: VoiceController) {
  const started = value.start();
  await flush();
  const socket = FakeSocket.instances.at(-1)!;
  expect(socket).toBeDefined();
  socket.open();
  socket.message({ setupComplete: {} });
  await started;
  return socket;
}

beforeEach(() => {
  vi.useFakeTimers();
  FakeSocket.instances = [];
  FakeAudio.instances = [];
  FakeWorklet.instances = [];
  controllers = [];
  leaseCount = 0;
  state = createCookingSession(recipeCatalog[0], { ownerId: "test-owner" });
  doc = Object.assign(new EventTarget(), { visibilityState: "visible" });
  win = Object.assign(new EventTarget(), { AudioContext: FakeAudio });
  track = { stop: vi.fn(), onended: null };
  vi.stubGlobal("document", doc);
  vi.stubGlobal("window", win);
  vi.stubGlobal("navigator", {
    onLine: true,
    mediaDevices: {
      getUserMedia: vi.fn(async () => ({ getTracks: () => [track] })),
    },
  });
  vi.stubGlobal("AudioWorkletNode", FakeWorklet);
  vi.stubGlobal("WebSocket", FakeSocket);
  events = {
    status: vi.fn(),
    transcript: vi.fn(),
    error: vi.fn(),
    session: vi.fn(),
  };
  apiMock
    .mockReset()
    .mockImplementation(async (path, body) => response(path, body));
});
afterEach(async () => {
  controllers.forEach((value) => value.dispose());
  await flush();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("voice lifecycle without provider credentials or microphone capture", () => {
  it("owns and closes a pending socket, microphone, worklet and context when stopped before setup", async () => {
    const value = controller();
    const starting = value.start();
    await flush();
    expect(FakeSocket.instances).toHaveLength(1);
    value.stop();
    await starting;
    await flush();
    expect(track.stop).toHaveBeenCalledOnce();
    expect(FakeSocket.instances[0].close).toHaveBeenCalled();
    expect(FakeAudio.instances[0].close).toHaveBeenCalledOnce();
    expect(FakeWorklet.instances[0].port.close).toHaveBeenCalledOnce();
    expect(
      apiMock.mock.calls.some(
        ([path, body]) => path === "/voice/lease" && body.action === "release",
      ),
    ).toBe(true);
    expect(events.status).toHaveBeenLastCalledWith("idle");
  });
  it("times out a setup that never completes and immediately releases hardware", async () => {
    const value = controller();
    const result = value.start().then(
      () => null,
      (error) => error,
    );
    await flush();
    FakeSocket.instances[0].open();
    await vi.advanceTimersByTimeAsync(15000);
    expect((await result)?.message).toMatch(/did not finish connecting/);
    expect(track.stop).toHaveBeenCalledOnce();
    expect(FakeAudio.instances[0].state).toBe("closed");
    expect(events.status).toHaveBeenLastCalledWith("error");
  });
  it.each(["hidden", "offline"] as const)(
    "stops active capture and socket on %s",
    async (cause) => {
      const value = controller();
      const socket = await connected(value);
      expect(events.status).toHaveBeenLastCalledWith("listening");
      if (cause === "hidden") {
        doc.visibilityState = "hidden";
        doc.dispatchEvent(new Event("visibilitychange"));
      } else win.dispatchEvent(new Event("offline"));
      await flush();
      expect(track.stop).toHaveBeenCalledOnce();
      expect(socket.close).toHaveBeenCalled();
      expect(FakeAudio.instances[0].state).toBe("closed");
    },
  );
  it("ignores old-generation binary server messages after pause and reconnect", async () => {
    const value = controller(),
      oldSocket = await connected(value);
    value.stop();
    await flush();
    await connected(value);
    oldSocket.message({
      serverContent: { inputTranscription: { text: "stale old turn" } },
    });
    await flush();
    expect(
      events.transcript.mock.calls.some(([text]) => text === "stale old turn"),
    ).toBe(false);
    expect(events.status).toHaveBeenLastCalledWith("listening");
  });
  it("waits for the previous lease release before a rapid pause-to-talk acquisition", async () => {
    let resolveRelease: ((value: unknown) => void) | undefined;
    let releases = 0;
    apiMock.mockImplementation(async (path, body) => {
      if (
        path === "/voice/lease" &&
        body?.action === "release" &&
        releases++ === 0
      )
        return new Promise((resolve) => {
          resolveRelease = resolve;
        });
      return response(path, body);
    });
    const value = controller();
    await connected(value);
    value.stop();
    await flush();
    const restarted = value.start();
    await flush();
    expect(
      apiMock.mock.calls.filter(
        ([path, body]) => path === "/voice/lease" && body.action === "acquire",
      ),
    ).toHaveLength(1);
    resolveRelease!({ lease: null });
    await flush();
    expect(
      apiMock.mock.calls.filter(
        ([path, body]) => path === "/voice/lease" && body.action === "acquire",
      ),
    ).toHaveLength(2);
    const socket = FakeSocket.instances.at(-1)!;
    socket.open();
    socket.message({ setupComplete: {} });
    await restarted;
    expect(events.status).toHaveBeenLastCalledWith("listening");
  });
  it("removes page lifecycle listeners on disposal", async () => {
    const value = controller();
    await connected(value);
    value.dispose();
    await flush();
    events.status.mockClear();
    win.dispatchEvent(new Event("offline"));
    doc.visibilityState = "hidden";
    doc.dispatchEvent(new Event("visibilitychange"));
    expect(events.status).not.toHaveBeenCalled();
    await expect(value.start()).rejects.toThrow(/closed/);
  });
});

describe("PCM transport and bounded worklet resampling", () => {
  it("decodes little-endian PCM and base64 without clipping or changing bytes", () => {
    expect([
      ...pcm16ToFloat32(new Uint8Array([0, 128, 0, 0, 255, 127])),
    ]).toEqual([-1, 0, 32767 / 32768]);
    expect(pcmBytesToBase64(new Uint8Array([0, 255, 128, 42]))).toBe(
      "AP+AKg==",
    );
  });
  it.each([16000, 44100, 48000])(
    "resamples %iHz in streaming chunks into 16kHz 20ms little-endian frames",
    (rate) => {
      const frames: ArrayBuffer[] = [];
      type Processor = {
        process: (input: Float32Array[][], output: Float32Array[][]) => boolean;
        port: { onmessage: (event: { data: { type: string } }) => void };
        carry: Float32Array;
      };
      let Constructor: (new () => Processor) | undefined;
      class WorkletBase {
        port = {
          onmessage: null,
          postMessage: ({ buffer }: { buffer: ArrayBuffer }) =>
            frames.push(buffer),
        };
      }
      const context = vm.createContext({
        AudioWorkletProcessor: WorkletBase,
        sampleRate: rate,
        registerProcessor: (_name: string, type: new () => Processor) => {
          Constructor = type;
        },
        Float32Array,
        Int16Array,
        ArrayBuffer,
        DataView,
        Math,
      });
      vm.runInContext(
        readFileSync(
          new URL("../../public/audio/pcm-capture.js", import.meta.url),
          "utf8",
        ),
        context,
      );
      const processor = new Constructor!();
      for (let offset = 0; offset < rate; offset += 128)
        processor.process(
          [[new Float32Array(Math.min(128, rate - offset)).fill(0.5)]],
          [[new Float32Array(128)]],
        );
      // One look-ahead input sample completes the final interpolated output at native16k.
      processor.process([[new Float32Array([0.5])]], [[new Float32Array(128)]]);
      expect(frames).toHaveLength(50);
      expect(frames.every((buffer) => buffer.byteLength === 640)).toBe(true);
      expect(new DataView(frames[0]).getInt16(0, true)).toBe(16384);
      expect(processor.carry.length).toBeLessThanOrEqual(3);
      processor.port.onmessage({ data: { type: "stop" } });
      expect(
        processor.process([[new Float32Array(128)]], [[new Float32Array(128)]]),
      ).toBe(false);
      expect(processor.carry).toHaveLength(0);
      expect(frames).toHaveLength(50);
    },
  );
});

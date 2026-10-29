import { useEffect, useRef } from "react";
import type { RefObject, TextareaHTMLAttributes } from "react";

export default function KitchenTextarea({
  inputRef,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  inputRef?: RefObject<HTMLTextAreaElement | null>;
}) {
  const element = useRef<HTMLTextAreaElement | null>(null);
  function grow() {
    if (!element.current) return;
    element.current.style.height = "auto";
    element.current.style.height = `${Math.min(240, Math.max(80, element.current.scrollHeight))}px`;
  }
  useEffect(() => {
    const frame = requestAnimationFrame(grow);
    return () => cancelAnimationFrame(frame);
  }, [props.value]);
  return (
    <textarea
      {...props}
      className={`resize-none ${props.className || ""}`}
      style={{ ...props.style, resize: "none", minHeight: 80, maxHeight: 240 }}
      ref={(node) => {
        element.current = node;
        if (inputRef) inputRef.current = node;
      }}
      onInput={(event) => {
        grow();
        props.onInput?.(event);
      }}
    />
  );
}

"use client";

import { useFormStatus } from "react-dom";

interface Props {
  children: React.ReactNode;
  className?: string;
  // 指定した場合のみ送信中はボタンの文言を差し替える（アイコンのみの小さいボタンでは指定しない）
  pendingText?: string;
  disabled?: boolean;
  formAction?: (formData: FormData) => void | Promise<void>;
}

// フォーム送信中はボタンを無効化する（何も反応がないように見えて連打されるのを防ぐため）
export default function SubmitButton({ children, className, pendingText, disabled, formAction }: Props) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className={className} formAction={formAction} disabled={pending || disabled}>
      {pending && pendingText ? pendingText : children}
    </button>
  );
}

"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useEffect, useState } from "react";

export function SpeakButton({ text }: { text: string }) {
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported("speechSynthesis" in window);
    return () => window.speechSynthesis?.cancel();
  }, []);

  const speak = () => {
    if (!supported) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "th-TH";
    utterance.rate = 0.88;
    utterance.pitch = 1;
    const thaiVoice = window.speechSynthesis.getVoices().find((voice) => voice.lang.toLowerCase().startsWith("th"));
    if (thaiVoice) utterance.voice = thaiVoice;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  return <button type="button" className="speak-button" onClick={speak} disabled={!supported} aria-label={speaking ? "หยุดเสียงอ่าน" : "อ่านออกเสียงภาษาไทย"} title={supported ? "อ่านออกเสียงภาษาไทย" : "เบราว์เซอร์นี้ไม่รองรับเสียงอ่าน"}>
    {supported && speaking ? <VolumeX size={16} /> : <Volume2 size={16} />} {speaking ? "หยุดเสียง" : "ฟังภาษาไทย"}
  </button>;
}

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

const SpeechRecognitionCtor =
  typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

export default function TextArea({
  label,
  id,
  error,
  helpText,
  rows = 4,
  maxLength,
  value = '',
  className = '',
  required = false,
  enableDictation = false,
  onChange,
  ...props
}) {
  const charCount = value ? value.length : 0;
  const dictationSupported = enableDictation && !!SpeechRecognitionCtor;

  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);
  const cursorPosRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const [dictationError, setDictationError] = useState(null);

  useEffect(() => () => recognitionRef.current?.stop(), []);

  const insertText = (text) => {
    const current = value || '';
    const pos = cursorPosRef.current != null ? cursorPosRef.current : current.length;
    const before = current.slice(0, pos);
    const after = current.slice(pos);
    const needsSpace = before && !/\s$/.test(before) ? ' ' : '';
    const inserted = needsSpace + text;
    const next = before + inserted + after;
    const newPos = pos + inserted.length;
    cursorPosRef.current = newPos;
    onChange?.({ target: { value: next } });
    requestAnimationFrame(() => {
      textareaRef.current?.setSelectionRange(newPos, newPos);
    });
  };

  const toggleListening = () => {
    if (!dictationSupported) return;

    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    setDictationError(null);
    cursorPosRef.current = textareaRef.current ? textareaRef.current.selectionStart : (value || '').length;

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event) => {
      if (event.error === 'not-allowed' || event.error === 'permission-denied' || event.error === 'service-not-allowed') {
        setDictationError('Microphone access denied — check your browser permissions.');
      } else if (event.error === 'no-speech') {
        setDictationError('No speech detected. Try again.');
      } else if (event.error === 'aborted') {
        // user-initiated stop — not an error worth surfacing
      } else {
        setDictationError('Dictation failed — please try again.');
      }
      setIsListening(false);
    };
    recognition.onresult = (event) => {
      let finalText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalText += event.results[i][0].transcript;
        }
      }
      if (finalText.trim()) {
        insertText(finalText.trim());
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between items-center mb-1">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-text-primary">
            {label} {required && <span className="text-error">*</span>}
          </label>
        )}
        <div className="flex items-center gap-2">
          {maxLength && (
            <span className="text-xs text-text-secondary">
              {charCount}/{maxLength}
            </span>
          )}
          {dictationSupported && (
            <motion.button
              type="button"
              onClick={toggleListening}
              whileTap={{ scale: 0.9 }}
              className={`relative inline-flex items-center justify-center w-6 h-6 rounded-full transition-colors ${
                isListening ? 'text-error' : 'text-text-secondary hover:text-primary'
              }`}
              aria-label={isListening ? 'Stop dictation' : 'Start dictation'}
              title={isListening ? 'Stop dictation' : 'Dictate'}
            >
              {isListening && (
                <motion.span
                  className="absolute inset-0 rounded-full bg-error/30"
                  animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}
              <span className="material-symbols-outlined text-[18px] relative">
                {isListening ? 'mic' : 'mic_none'}
              </span>
            </motion.button>
          )}
        </div>
      </div>
      <textarea
        id={id}
        ref={textareaRef}
        rows={rows}
        maxLength={maxLength}
        value={value}
        onChange={onChange}
        required={required}
        className={`block w-full appearance-none rounded-lg border px-3 py-2.5 bg-card text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm resize-y break-words ${error ? 'border-error focus:ring-error/20 focus:border-error' : 'border-border'
          }`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-error font-medium">{error}</p>}
      {!error && helpText && <p className="mt-1 text-xs text-text-secondary">{helpText}</p>}
      {dictationError && <p className="mt-1 text-xs text-error font-medium">{dictationError}</p>}
    </div>
  );
}

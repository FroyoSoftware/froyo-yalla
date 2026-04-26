-- Align DB constraint with UI limit (maxLength=150)
ALTER TABLE participant_note
  DROP CONSTRAINT IF EXISTS participant_note_note_check,
  ADD CONSTRAINT participant_note_note_check CHECK (char_length(note) <= 150);

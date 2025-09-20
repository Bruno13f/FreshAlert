CREATE TABLE linhas (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    fornecedor TEXT
);

CREATE TABLE atividades (
    id SERIAL PRIMARY KEY,
    linha_id INTEGER NOT NULL REFERENCES linhas(id),
    is_fresh BOOLEAN,
    verified_at TIMESTAMP
);
 
INSERT INTO linhas (fornecedor)
VALUES
  ('Lusifruta'),
  ('Fruta Fresca'),
  ('Frutalicious');

INSERT INTO atividades (linha_id, is_fresh, verified_at)
VALUES
  (1, TRUE,  '2025-09-16 08:30:00'),
  (2, FALSE, '2025-09-16 09:15:00'),
  (3, TRUE,  '2025-09-16 15:45:00'),
  (1, TRUE,  '2025-09-17 07:50:00'),
  (2, TRUE,  '2025-09-17 10:05:00'),
  (3, FALSE, '2025-09-17 12:20:00'),
  (1, FALSE, '2025-09-18 08:10:00'),
  (2, TRUE,  '2025-09-18 11:40:00'),
  (3, TRUE,  '2025-09-18 13:25:00'),
  (1, TRUE,  '2025-09-18 16:00:00'),
  (2, FALSE, '2025-09-19 07:55:00'),
  (3, TRUE,  '2025-09-19 09:45:00'),
  (1, TRUE,  '2025-09-19 14:30:00'),
  (2, TRUE,  '2025-09-19 17:20:00'),
  (3, FALSE, '2025-09-20 08:05:00'),
  (1, TRUE,  '2025-09-20 10:50:00'),
  (2, TRUE,  '2025-09-20 12:15:00'),
  (3, TRUE,  '2025-09-20 13:40:00'),
  (1, FALSE, '2025-09-20 15:10:00'),
  (2, TRUE,  '2025-09-20 16:35:00');
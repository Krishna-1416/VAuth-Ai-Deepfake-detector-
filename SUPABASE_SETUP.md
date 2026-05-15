# Supabase Vector Setup (Gemma 4 / Gemini Edition)

Follow these steps to configure your Supabase database for the 3072-dimensional vectors used by the Gemini Embedding model.

### 1. Database Schema
Copy and paste the following code into your **Supabase SQL Editor** and click **Run**:

```sql
-- RESET FORENSIC KNOWLEDGE TABLE FOR GEMINI 3072D VECTORS
DROP FUNCTION IF EXISTS match_documents(vector, float8, int);
DROP TABLE IF EXISTS forensic_knowledge;

CREATE EXTENSION IF NOT EXISTS vector;

-- Create table with 3072 dimensions
CREATE TABLE forensic_knowledge (
  id uuid primary key default gen_random_uuid(),
  content text,
  embedding vector(3072),
  metadata jsonb
);

-- Create standard search function
CREATE OR REPLACE FUNCTION match_documents (
  query_embedding vector,
  match_threshold float8,
  match_count int
)
RETURNS TABLE (
  id uuid,
  content text,
  metadata jsonb,
  similarity float8
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    fk.id,
    fk.content,
    fk.metadata,
    1 - (fk.embedding <=> query_embedding) AS similarity
  FROM forensic_knowledge fk
  WHERE 1 - (fk.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;
```

### 2. Populate Knowledge Base
After running the SQL, execute the following command in your terminal to seed the forensic heuristics:

```powershell
cd scripts
python populate_forensic_db.py
```

### 3. Verify
You should see a message saying "Successfully populated forensic_knowledge table!". The V-Auth backend will now be able to retrieve grounded forensic data for its analysis.

/*
  # Add author field to book_loans table

  1. Changes
    - Add `autor` column to `book_loans` table to store the book's author name
    - Set default value to empty string for existing records
*/

ALTER TABLE book_loans
ADD COLUMN IF NOT EXISTS autor text NOT NULL DEFAULT '';
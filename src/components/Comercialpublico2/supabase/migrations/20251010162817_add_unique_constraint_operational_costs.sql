/*
  # Add unique constraint to operational_costs

  1. Changes
    - Add unique constraint on (cost_name, year, month, department)
    - This allows upsert operations to work correctly
    - Prevents duplicate entries for the same cost in the same month/year/department
*/

ALTER TABLE operational_costs 
ADD CONSTRAINT operational_costs_unique_entry 
UNIQUE (cost_name, year, month, department);
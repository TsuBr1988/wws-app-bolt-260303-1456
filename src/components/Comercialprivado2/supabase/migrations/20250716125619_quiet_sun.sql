/*
  # Remove Authentication Requirements

  This migration removes all authentication requirements from the database,
  making all tables accessible without authentication.

  1. Updates
    - Disables RLS on all tables
    - Drops all RLS policies
    - Drops all auth-related functions
  
  2. Security Note
    - This removes all security restrictions
    - All data will be publicly accessible
    - Only use in development or controlled environments
*/

-- Disable RLS on all tables
ALTER TABLE public.employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_badges DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.probability_scores DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bonus_contributions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.recognitions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_configurations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_performance DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- Drop all RLS policies
DROP POLICY IF EXISTS "Anyone authenticated can read employees" ON public.employees;
DROP POLICY IF EXISTS "Only admins can delete employees" ON public.employees;
DROP POLICY IF EXISTS "Only admins can insert employees" ON public.employees;
DROP POLICY IF EXISTS "Only admins can update employees" ON public.employees;

DROP POLICY IF EXISTS "Anyone authenticated can read badges" ON public.badges;
DROP POLICY IF EXISTS "Only admins can manage badges" ON public.badges;

DROP POLICY IF EXISTS "Anyone authenticated can read employee_badges" ON public.employee_badges;
DROP POLICY IF EXISTS "Only admins can manage employee_badges" ON public.employee_badges;

DROP POLICY IF EXISTS "Anyone authenticated can read probability_scores" ON public.probability_scores;
DROP POLICY IF EXISTS "Authorized users can manage probability_scores" ON public.probability_scores;

DROP POLICY IF EXISTS "Anyone authenticated can read bonus_contributions" ON public.bonus_contributions;
DROP POLICY IF EXISTS "Only admins can manage bonus_contributions" ON public.bonus_contributions;

DROP POLICY IF EXISTS "Anyone authenticated can read recognitions" ON public.recognitions;
DROP POLICY IF EXISTS "Only admins can manage recognitions" ON public.recognitions;

DROP POLICY IF EXISTS "Anyone authenticated can read campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Only admins can manage campaigns" ON public.campaigns;

DROP POLICY IF EXISTS "Anyone authenticated can read proposals" ON public.proposals;
DROP POLICY IF EXISTS "Authorized users can insert proposals" ON public.proposals;
DROP POLICY IF EXISTS "Authorized users can update proposals" ON public.proposals;
DROP POLICY IF EXISTS "Only admins can delete proposals" ON public.proposals;

DROP POLICY IF EXISTS "Anyone authenticated can read rewards" ON public.rewards;
DROP POLICY IF EXISTS "Only admins can manage rewards" ON public.rewards;

DROP POLICY IF EXISTS "Anyone authenticated can read system_configurations" ON public.system_configurations;
DROP POLICY IF EXISTS "Only admins can manage system_configurations" ON public.system_configurations;

DROP POLICY IF EXISTS "Anyone authenticated can read weekly_performance" ON public.weekly_performance;
DROP POLICY IF EXISTS "Only admins can manage weekly_performance" ON public.weekly_performance;

DROP POLICY IF EXISTS "user_profiles_admin_all" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert_own" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_select_own" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_own" ON public.user_profiles;

-- Drop auth-related functions
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.can_edit_proposals();

-- Create a simple function to replace is_admin() if needed by triggers
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN true; -- Always return true since we're removing auth
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a simple function to replace can_edit_proposals() if needed by triggers
CREATE OR REPLACE FUNCTION public.can_edit_proposals()
RETURNS boolean AS $$
BEGIN
  RETURN true; -- Always return true since we're removing auth
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update any triggers or functions that might depend on auth.uid()
-- For example, if there are any functions using auth.uid(), replace with a dummy value or logic

-- Run ANALYZE to update statistics
ANALYZE;
/*
  # Create user profiles trigger

  1. Trigger Function
    - Creates user profile automatically when user signs up
    - Sets default role as 'sdr'
    - Uses user email and id from auth.users

  2. Security
    - Trigger runs with security definer privileges
    - Automatically creates profile for new users
*/

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, email, role)
  VALUES (NEW.id, NEW.email, 'sdr');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile for new users
DROP TRIGGER IF EXISTS create_user_profile_trigger ON auth.users;
CREATE TRIGGER create_user_profile_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_profile();
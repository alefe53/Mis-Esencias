// src/auth/authService.js
import { supabase } from '../config/supabase.js';
import jwt from 'jsonwebtoken';
import { config } from '../config/config.js';

class AuthService {
  async register({ email, password, firstName, lastName }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        }
      }
    });

    if (error) throw new Error(error.message);
    return data;
  }

  async login({ email, password }) {

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) throw new Error(authError.message);

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single(); 

    if (profileError) throw new Error(profileError.message);
    if (!profile) throw new Error('No se encontró el perfil del usuario.');

    const userPayload = {
      id: profile.id,
      email: authData.user.email,
      subscription_tier_id: profile.subscription_tier_id,
      first_name: profile.first_name,
      last_name: profile.last_name, 
    };
    
    const token = jwt.sign(userPayload, config.jwt.SECRET, { expiresIn: config.jwt.EXPIRES_IN });
    
    return { token, user: userPayload };
  }
}

export default new AuthService();

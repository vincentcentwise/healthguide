import { supabase } from './supabase.js'; // your supabase client file

async function loadProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    window.location.href = '/login.html';
    return;
  }

  const { data: profile, error } = await supabase.from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    console.log("No profile yet, creating...");
    return;
  }

  document.getElementById('profile-info').innerHTML = `
    <h3>${profile.full_name || 'No name set'}</h3>
    <p><b>Email:</b> ${user.email}</p>
    <p><b>Role:</b> ${profile.role}</p>
    <p><b>Status:</b> ${profile.status}</p>
    <button id="logout">Logout</button>
  `;

  document.getElementById('logout').onclick = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login.html';
  };
}

loadProfile();
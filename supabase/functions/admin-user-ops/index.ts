import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Only callable by authenticated users; caller's JWT is verified first
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Anon client — used to verify the caller is admin/operations_team
    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: userErr } = await anonClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify caller has admin or operations_team role
    const { data: profile } = await anonClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile || !['admin', 'operations_team'].includes(profile.role)) {
      return new Response(JSON.stringify({ error: 'Forbidden: admin access required' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Service-role client — used for privileged operations
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const body = await req.json();
    const { action } = body;

    // ── CREATE USER ─────────────────────────────────────────────────────────
    if (action === 'create') {
      const { email, password, full_name, role, phone } = body;
      if (!email || !password || !role) {
        return new Response(JSON.stringify({ error: 'email, password, and role are required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,           // skip email verification for admin-created accounts
        user_metadata: { full_name, role },
      });
      if (createErr) {
        return new Response(JSON.stringify({ error: createErr.message }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Update profile row created by the trigger
      if (newUser?.user) {
        await adminClient.from('profiles').update({
          full_name: full_name || null,
          role,
          phone: phone || null,
          status: 'active',
        }).eq('id', newUser.user.id);
      }

      return new Response(JSON.stringify({ success: true, user_id: newUser?.user?.id }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── UPDATE PROFILE (name / phone / district / village) ──────────────────
    if (action === 'update_profile') {
      const { user_id, full_name, phone, district, village, national_id } = body;
      if (!user_id) {
        return new Response(JSON.stringify({ error: 'user_id is required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const updates: Record<string, unknown> = {};
      if (full_name !== undefined) updates.full_name = full_name || null;
      if (phone !== undefined) updates.phone = phone || null;
      if (district !== undefined) updates.district = district || null;
      if (village !== undefined) updates.village = village || null;
      if (national_id !== undefined) updates.national_id = national_id || null;

      const { error } = await adminClient.from('profiles').update(updates).eq('id', user_id);
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ success: true }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── UPDATE ROLE ──────────────────────────────────────────────────────────
    if (action === 'update_role') {
      const { user_id, role: newRole } = body;
      if (!user_id || !newRole) {
        return new Response(JSON.stringify({ error: 'user_id and role are required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const { error } = await adminClient.from('profiles').update({ role: newRole }).eq('id', user_id);
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ success: true }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── UPDATE STATUS (activate / suspend / deactivate) ─────────────────────
    if (action === 'update_status') {
      const { user_id, status } = body;
      if (!user_id || !status) {
        return new Response(JSON.stringify({ error: 'user_id and status are required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const allowed = ['active', 'suspended', 'inactive'];
      if (!allowed.includes(status)) {
        return new Response(JSON.stringify({ error: `status must be one of: ${allowed.join(', ')}` }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Disable/enable Supabase Auth login as well
      const { error: authErr } = await adminClient.auth.admin.updateUserById(user_id, {
        ban_duration: status === 'active' ? 'none' : '876600h', // ~100 years = effectively permanent
      });
      if (authErr) {
        return new Response(JSON.stringify({ error: authErr.message }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { error } = await adminClient.from('profiles').update({ status }).eq('id', user_id);
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ success: true }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

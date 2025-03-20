// In src/utils/adminTools.js

export const repairPolicies = async () => {
    if (!confirm('This will temporarily disable and re-enable RLS for the profiles table. Continue?')) {
      return;
    }
    
    try {
      // Execute repair via RPC to avoid client-side SQL execution limitations
      const { data, error } = await supabase.rpc('admin_repair_profile_policies');
      
      if (error) throw error;
      
      alert('Policy repair completed. Please refresh the application.');
      window.location.reload();
    } catch (err) {
      console.error('Policy repair failed:', err);
      alert('Policy repair failed: ' + err.message);
    }
  };
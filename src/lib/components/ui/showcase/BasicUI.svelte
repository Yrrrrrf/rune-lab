<script lang="ts">
  // Shared data for both buttons and badgesdeno 
  const colors = ['neutral', 'primary', 'secondary', 'accent', 'info', 'success', 'warning', 'error'];
  const styles = [
    { id: 'default', label: 'Default', btnClass: '', badgeClass: '' },
    { id: 'soft', label: 'Soft', btnClass: 'btn-soft', badgeClass: 'badge-soft' },
    { id: 'outline', label: 'Outline', btnClass: 'btn-outline', badgeClass: 'badge-outline' },
    { id: 'dash', label: 'Dash', btnClass: 'btn-dash', badgeClass: 'badge-dash' },
    { id: 'ghost', label: 'Ghost', btnClass: 'btn-ghost', badgeClass: 'badge-ghost' }
  ];
</script>

<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <!-- Buttons Showcase -->
  <div class="card bg-base-100 shadow-xl">
    <div class="card-body">
      <h2 class="card-title">Buttons</h2>
      
      {#each styles as style}
        <div class="divider">{style.label} Buttons</div>
        <div class="flex flex-wrap gap-2">
          {#each colors as color}
            <button class="btn {style.btnClass} btn-{color}">{color}</button>
          {/each}
        </div>
      {/each}
    </div>
  </div>

  <!-- Badges Showcase -->
  <div class="card bg-base-100 shadow-xl">
    <div class="card-body">
      <h2 class="card-title">Badges</h2>
      
      {#each styles as style}
        <div class="divider">{style.label} Badges</div>
        <div class="flex flex-wrap gap-2">
          {#each colors as color}
            <div class="badge {style.badgeClass} badge-{color}">{color}</div>
          {/each}
        </div>
      {/each}
    </div>
  </div>
</div>
<script lang="ts">
  let { name, class: className = "" } = $props<{ name: string; class?: string }>();
</script>

<span class="material-symbols-outlined {className}">
  {name}
</span>

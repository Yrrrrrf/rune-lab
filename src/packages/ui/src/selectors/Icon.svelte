<script lang="ts">
let { name, class: className = "" }: { name: string; class?: string } =
  $props();
</script>
<span class="iconify {className}" data-icon={name}></span>

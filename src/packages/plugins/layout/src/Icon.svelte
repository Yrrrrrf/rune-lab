<script lang="ts">
interface Props {
  name: string;
  class?: string;
}
let { name, class: className = "" }: Props = $props();
</script>

<span class="material-symbols-outlined {className}">
  {name}
</span>

<script lang="ts">
let {
  text,
  width,
  style = "",
}: {
  text: string;
  width?: number;
  style?: string;
} = $props();
</script>

<div class="rl-text-line block select-text"
  style="{width !== undefined ? `width:${width}px;` : ''}{style}">
  {text}
</div>

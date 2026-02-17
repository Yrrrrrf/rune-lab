export interface ComponentRef {
  className: string;
  description: string;
}

export const SHOWCASE_COMPONENTS: Record<string, ComponentRef[]> = {
  actions: [
    { className: "btn", description: "Standard button primitive" },
    {
      className: "btn-soft",
      description: "Button with low-opacity background",
    },
    { className: "btn-outline", description: "Transparent with border" },
    { className: "btn-dash", description: "Dashed border variant" },
    { className: "btn-ghost", description: "No background until hover" },
    { className: "badge", description: "Inline label for counts or status" },
    { className: "swap", description: "Interactive toggle for icons/text" },
  ],
  "data-input": [
    { className: "input", description: "Standard text field" },
    { className: "select", description: "Standard dropdown picker" },
    { className: "checkbox", description: "Square selection box" },
    { className: "toggle", description: "Switch-style selection" },
    { className: "range", description: "Slider for numeric input" },
    { className: "rating", description: "Stars or icons for feedback" },
    { className: "file-input", description: "Stylized file picker" },
  ],
  display: [
    { className: "alert", description: "Critical or info messages" },
    { className: "card", description: "Containment for grouped content" },
    { className: "stat", description: "Data visualizations for numbers" },
    { className: "loading", description: "Animated status indicators" },
    { className: "progress", description: "Linear progress indicator" },
    {
      className: "radial-progress",
      description: "Circular progress indicator",
    },
  ],
  feedback: [
    { className: "toast", description: "Overlay notifications" },
    { className: "modal", description: "Dialog for focused tasks" },
    { className: "tooltip", description: "Small contextual popovers" },
    { className: "diff", description: "Side-by-side comparison" },
    { className: "skeleton", description: "Placeholder for loading content" },
  ],
  navigation: [
    { className: "menu", description: "Vertical or horizontal list nav" },
    { className: "tabs", description: "Switch between view panels" },
    { className: "breadcrumbs", description: "Hierarchical path display" },
    { className: "steps", description: "Multi-stage progress tracker" },
    { className: "navbar", description: "Top-level application header" },
    { className: "join", description: "Grouped navigation actions" },
  ],
  visual: [
    { className: "divider", description: "Thematic break or separator" },
    { className: "mask", description: "Image/shape framing" },
    { className: "stack", description: "Visual layering effect" },
    { className: "hero", description: "Large featured content area" },
    { className: "hover-3d", description: "Interactive perspective effect" },
    { className: "avatar", description: "User or entity profiles" },
  ],
};

export const SHOWCASE_SNIPPETS: Record<string, string> = {
  actions: '<button class="btn btn-primary">Button</button>',
  "data-input": '<input type="text" placeholder="Type here" class="input" />',
  display: '<div class="alert alert-info">Message</div>',
  feedback: '<span class="loading loading-spinner"></span>',
  navigation:
    '<ul class="menu bg-base-200 rounded-box"><li><a>Item</a></li></ul>',
  visual: '<div class="divider">OR</div>',
};

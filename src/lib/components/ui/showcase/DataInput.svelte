<script lang="ts">
    // Shared data for all input types
    const colors = ['neutral', 'primary', 'secondary', 'accent', 'info', 'success', 'warning', 'error'];
    const sizes = ['xs', 'sm', 'md', 'lg', 'xl'];

  </script>
  
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- File Input -->
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title">File Input</h2>
        
        <div class="divider">Colors</div>
        <div class="flex flex-wrap gap-2">
          {#each colors as color}
            <input type="file" class="file-input file-input-{color}" />
          {/each}
        </div>
        
        <div class="divider">Sizes</div>
        <div class="flex flex-col gap-2">
          {#each sizes as size}
            <input type="file" class="file-input file-input-{size}" />
          {/each}
        </div>

        <div class="divider">Styles</div>
        <div class="flex flex-wrap gap-2">
          <input type="file" class="file-input" />
          <input type="file" class="file-input file-input-ghost" />
        </div>
        
        <div class="divider">With Fieldset</div>
        <fieldset class="fieldset p-4 bg-base-200 border border-base-300 rounded-lg">
          <legend class="fieldset-legend">Upload file</legend>
          <input type="file" class="file-input file-input-primary w-full" />
          <span class="fieldset-label text-sm opacity-70">Max size 2MB</span>
        </fieldset>
      </div>
    </div>
  
    <!-- Checkbox -->
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title">Checkbox</h2>
        
        <div class="divider">Colors</div>
        <div class="flex flex-wrap gap-4">
          {#each colors as color}
            <input type="checkbox" checked class="checkbox checkbox-{color}" />
          {/each}
        </div>
        
        <div class="divider">Sizes</div>
        <div class="flex flex-wrap gap-4 items-center">
          {#each sizes as size}
            <input type="checkbox" checked class="checkbox checkbox-{size}" />
          {/each}
        </div>
        
        <div class="divider">States</div>
        <div class="flex flex-wrap gap-4">
          <div class="flex items-center gap-2">
            <input type="checkbox" class="checkbox" disabled />
            <span class="text-sm">Disabled</span>
          </div>
          <div class="flex items-center gap-2">
            <input type="checkbox" checked class="checkbox" disabled />
            <span class="text-sm">Disabled Checked</span>
          </div>
          <div class="flex items-center gap-2">
            <input type="checkbox" id="indeterminate-checkbox" class="checkbox" />
            <span class="text-sm">Indeterminate</span>
          </div>
        </div>
        
        <div class="divider">With Fieldset</div>
        <fieldset class="fieldset p-4 bg-base-200 border border-base-300 rounded-lg">
          <legend class="fieldset-legend">Options</legend>
          <div class="flex flex-col gap-2">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked class="checkbox checkbox-primary" />
              <span>Remember me</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" class="checkbox checkbox-primary" />
              <span>Subscribe to newsletter</span>
            </label>
          </div>
        </fieldset>
      </div>
    </div>
    
    <!-- Range Slider -->
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title">Range Slider</h2>
        
        <div class="divider">Colors</div>
        <div class="flex flex-col gap-4">
          {#each colors as color}
            <input type="range" min="0" max="100" value="40" class="range range-{color}" />
          {/each}
        </div>
        
        <div class="divider">Sizes</div>
        <div class="flex flex-col gap-4">
          {#each sizes as size}
            <input type="range" min="0" max="100" value={30 + sizes.indexOf(size) * 10} class="range range-{size}" />
          {/each}
        </div>
        
        <div class="divider">With Steps</div>
        <div class="w-full">
          <input type="range" min="0" max="100" value="25" class="range range-primary" step="25" />
          <div class="flex justify-between px-2 mt-2 text-xs">
            <span>|</span>
            <span>|</span>
            <span>|</span>
            <span>|</span>
            <span>|</span>
          </div>
          <div class="flex justify-between px-2 text-xs">
            <span>0</span>
            <span>25</span>
            <span>50</span>
            <span>75</span>
            <span>100</span>
          </div>
        </div>
      </div>
    </div>
  
    <!-- Labels and Select -->
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title">Labels & Selects</h2>
        
        <div class="divider">Label Positions</div>
        <div class="flex flex-col gap-4">
          <label class="input">
            <span class="label">https://</span>
            <input type="text" placeholder="URL" id="url-input" />
          </label>
          
          <label class="input">
            <input type="text" placeholder="domain name" id="domain-input" />
            <span class="label">.com</span>
          </label>
        </div>
        
        <div class="divider">Floating Label</div>
        <label class="floating-label">
          <span>Your Email</span>
          <input type="text" placeholder="mail@site.com" class="input input-md" id="email-input" />
        </label>
        
        <div class="divider">Select Colors</div>
        <div class="grid grid-cols-2 gap-4">
          {#each colors.slice(0, 4) as color}
            <select class="select select-{color}">
              <option disabled selected>Select {color}</option>
              <option>Option 1</option>
              <option>Option 2</option>
            </select>
          {/each}
        </div>
        
        <div class="divider">Select Sizes</div>
        <div class="flex flex-col gap-2">
          {#each sizes as size}
            <select class="select select-{size}">
              <option disabled selected>Size: {size}</option>
              <option>Option 1</option>
              <option>Option 2</option>
            </select>
          {/each}
        </div>
      </div>
    </div>
  </div>
  
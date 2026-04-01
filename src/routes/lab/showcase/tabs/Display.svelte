<script lang="ts">
    import ShowcaseCard from "../ShowcaseCard.svelte";
    import { COLORS } from "../shared";
    import { Icon } from "rune-lab";
</script>

<div class="space-y-6">
    <!-- Alerts -->
    <ShowcaseCard title="Alerts" icon="⚠️">
        <div class="flex flex-col gap-2">
            <div class="alert">
                <Icon name={"info" as never} class="w-4 h-4" />
                <span>Base alert</span>
            </div>
            
            <div class="alert alert-info">
                <Icon name={"info" as never} class="w-4 h-4" />
                <span>Info alert</span>
            </div>
            
            <div class="alert alert-success">
                <Icon name={"check" as never} class="w-4 h-4" />
                <span>Success alert</span>
            </div>
            
            <div class="alert alert-warning">
                <Icon name={"info" as never} class="w-4 h-4" />
                <span>Warning alert!</span>
            </div>
            
            <div class="alert alert-error">
                <Icon name={"close" as never} class="w-4 h-4" />
                <span>Error alert.</span>
            </div>
            
            <div class="alert alert-soft alert-primary">
                <Icon name={"info" as never} class="w-4 h-4" />
                <span>Soft Alert Primary</span>
            </div>
        </div>
    </ShowcaseCard>

    <!-- Cards -->
    <ShowcaseCard title="Cards" icon="🎴">
        <div class="flex flex-wrap gap-4">
            <div class="card w-64 bg-base-100 shadow-xl border border-base-content/10">
                <figure><img src="https://picsum.photos/400/200?random=11" alt="Shoes" /></figure>
                <div class="card-body">
                    <h2 class="card-title">Base Card</h2>
                    <p>If a dog chews shoes whose shoes does he choose?</p>
                    <div class="card-actions justify-end">
                        <button class="btn btn-primary btn-sm">Buy Now</button>
                    </div>
                </div>
            </div>

            <div class="card w-64 bg-primary text-primary-content shadow-xl">
                <div class="card-body">
                    <h2 class="card-title">Primary Solid</h2>
                    <p>If a dog chews shoes whose shoes does he choose?</p>
                    <div class="card-actions justify-end">
                        <button class="btn btn-sm">Buy Now</button>
                    </div>
                </div>
            </div>

            <div class="card w-64 bg-base-100 shadow-xl image-full">
                <figure><img src="https://picsum.photos/400/225?random=12" alt="Shoes" /></figure>
                <div class="card-body">
                    <h2 class="card-title">Image Full</h2>
                    <p>If a dog chews shoes whose shoes does he choose?</p>
                    <div class="card-actions justify-end">
                        <button class="btn btn-primary btn-sm">Buy Now</button>
                    </div>
                </div>
            </div>
        </div>
    </ShowcaseCard>

    <!-- Stats -->
    <ShowcaseCard title="Stats" icon="📈">
        <div class="flex flex-col gap-4">
            <div class="stats shadow border border-base-content/10 w-full">
                <div class="stat">
                    <div class="stat-figure text-primary">
                        <Icon name={"info" as never} class="w-8 h-8" />
                    </div>
                    <div class="stat-title">Total Pageloads</div>
                    <div class="stat-value text-primary">25.6K</div>
                    <div class="stat-desc">21% more than last month</div>
                </div>
                
                <div class="stat">
                    <div class="stat-figure text-secondary">
                        <Icon name={"check" as never} class="w-8 h-8" />
                    </div>
                    <div class="stat-title">Page Views</div>
                    <div class="stat-value text-secondary">2.6M</div>
                    <div class="stat-desc">21% more than last month</div>
                </div>
                
                <div class="stat">
                    <div class="stat-figure text-primary">
                        <Icon name={"settings" as never} class="w-8 h-8" />
                    </div>
                    <div class="stat-title">Tasks Done</div>
                    <div class="stat-value">86%</div>
                    <div class="stat-desc text-secondary">31 tasks remaining</div>
                </div>
            </div>

            <div class="stats bg-primary text-primary-content border border-primary w-full">
                <div class="stat">
                    <div class="stat-title">Account balance</div>
                    <div class="stat-value">$89,400</div>
                    <div class="stat-actions">
                        <button class="btn btn-sm btn-success">Add funds</button>
                    </div>
                </div>
                <div class="stat">
                    <div class="stat-title">Current balance</div>
                    <div class="stat-value">$89,400</div>
                    <div class="stat-actions">
                        <button class="btn btn-sm">Withdrawal</button> 
                        <button class="btn btn-sm">Deposit</button>
                    </div>
                </div>
            </div>
        </div>
    </ShowcaseCard>

    <!-- Progress & Loading -->
    <ShowcaseCard title="Progress & Loading" icon="⌛">
        <div class="flex flex-col gap-8">
            <div class="flex gap-4">
                <span class="loading loading-spinner loading-xs"></span>
                <span class="loading loading-spinner loading-sm"></span>
                <span class="loading loading-spinner loading-md"></span>
                <span class="loading loading-spinner loading-lg"></span>
            </div>
            
            <div class="flex gap-4">
                {#each COLORS.slice(0, 4) as color}
                    <span class="loading loading-dots loading-lg text-{color}"></span>
                {/each}
            </div>
            
            <div class="flex flex-col gap-2 max-w-sm">
                <progress class="progress w-full"></progress>
                {#each COLORS.slice(0, 4) as color}
                    <progress class="progress progress-{color} w-full" value="{(COLORS.indexOf(color) + 1) * 20}" max="100"></progress>
                {/each}
            </div>
            
            <div class="flex gap-4 items-center">
                <div class="radial-progress" style="--value:70;" role="progressbar">70%</div>
                <div class="radial-progress text-primary" style="--value:70; --size:3rem; --thickness: 0.2rem;" role="progressbar">70%</div>
                <div class="radial-progress text-secondary" style="--value:70; --size:4rem; --thickness: 0.4rem;" role="progressbar">70%</div>
                <div class="radial-progress bg-primary text-primary-content border-4 border-primary" style="--value:70;" role="progressbar">70%</div>
            </div>
        </div>
    </ShowcaseCard>
    
    <!-- Countdown & Timeline -->
    <ShowcaseCard title="Countdown & Timeline" icon="⌚">
        <div class="flex flex-col gap-8">
            <div class="flex gap-5">
                <div>
                    <span class="countdown font-mono text-4xl">
                        <span style="--value:15;"></span>
                    </span>
                    days
                </div>
                <div>
                    <span class="countdown font-mono text-4xl">
                        <span style="--value:10;"></span>
                    </span>
                    hours
                </div>
                <div>
                    <span class="countdown font-mono text-4xl">
                        <span style="--value:24;"></span>
                    </span>
                    min
                </div>
            </div>
            
            <ul class="timeline timeline-vertical">
                <li>
                    <div class="timeline-start">1984</div>
                    <div class="timeline-middle">
                        <Icon name={"check" as never} class="w-4 h-4 text-primary" />
                    </div>
                    <div class="timeline-end timeline-box">First Macintosh</div>
                    <hr class="bg-primary"/>
                </li>
                <li>
                    <hr class="bg-primary"/>
                    <div class="timeline-start">1998</div>
                    <div class="timeline-middle">
                        <Icon name={"check" as never} class="w-4 h-4 text-primary" />
                    </div>
                    <div class="timeline-end timeline-box">iMac</div>
                    <hr />
                </li>
                <li>
                    <hr />
                    <div class="timeline-start">2001</div>
                    <div class="timeline-middle">
                        <Icon name={"close" as never} class="w-4 h-4 text-error" />
                    </div>
                    <div class="timeline-end timeline-box">iPod</div>
                </li>
            </ul>
        </div>
    </ShowcaseCard>
</div>

<script lang="ts">
  import { onMount } from "svelte";
  import { APIMonitor } from "rune-lab/api";
  import { Logo } from "rune-lab/corpo";
  import {
    getCommandStore,
    getRegistryStore,
    getToastStore,
    type Command,
  } from "rune-lab/palettes";
  import { company } from "$lib/config";

  const commands = getCommandStore();
  const registry = getRegistryStore();
  const toasts = getToastStore();
  const sayHello = () => toasts.success(`Hello from ${company.name}!`);

  onMount(() => {
    const items: Command[] = [
      {
        id: "corpo.hello",
        label: "Say hello",
        category: company.name,
        action: sayHello,
      },
      {
        id: "corpo.settings",
        label: "Open settings",
        category: company.name,
        action: () => registry.open("settings"),
      },
    ];
    for (const item of items) commands.register(item);
    return () => {
      for (const item of items) commands.unregister(item.id);
    };
  });
</script>

<div class="mx-auto max-w-6xl px-6">
  <section class="hero min-h-[65dvh] py-16 sm:py-24" aria-labelledby="headline">
    <div
      class="hero-content w-full flex-col items-start gap-10 px-0 lg:flex-row lg:items-center lg:justify-between"
    >
      <div class="max-w-2xl">
        <p
          class="mb-5 text-sm font-semibold uppercase tracking-widest text-primary"
        >
          {company.name} / Independent studio
        </p>
        <h1
          id="headline"
          class="text-5xl font-semibold tracking-tight sm:text-7xl"
        >
          Make room<br />for good ideas.
        </h1>
        <p class="mt-6 max-w-lg text-lg leading-relaxed opacity-70">
          We turn thoughtful ideas into useful digital experiences. Simple to
          use. Made to feel like you.
        </p>
        <div class="mt-8 flex flex-wrap gap-3">
          <a class="btn btn-primary" href="#experience"
            >Explore the experience</a
          >
          <a class="btn btn-ghost" href="#about">Meet {company.name}</a>
        </div>
      </div>
      <div class="card w-full max-w-sm border border-base-300 bg-base-200">
        <div class="card-body gap-6 p-8">
          <div
            class="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-3xl text-primary-content"
          >
            <Logo decorative />
          </div>
          <div>
            <p class="text-2xl font-semibold">{company.name}</p>
            <p class="mt-2 leading-relaxed opacity-70">{company.tagline}</p>
          </div>
          <div
            class="flex items-center gap-2 border-t border-base-300 pt-5 text-sm"
          >
            <span class="status status-primary" aria-hidden="true"></span>
            A little clarity goes a long way.
          </div>
        </div>
      </div>
    </div>
  </section>

  <section
    id="about"
    class="scroll-mt-8 border-t border-base-300 py-12 sm:py-16"
    aria-labelledby="about-title"
  >
    <div class="grid gap-6 md:grid-cols-2 md:gap-16">
      <h2 id="about-title" class="text-3xl font-semibold tracking-tight">
        A familiar feel.<br />Everywhere you work.
      </h2>
      <p class="max-w-xl text-lg leading-relaxed opacity-70">
        One identity, from your first visit to your everyday workspace. We care
        about the small details that make an experience feel connected.
      </p>
    </div>
  </section>

  <section
    id="experience"
    class="scroll-mt-8 border-t border-base-300 py-12 sm:py-16"
    aria-labelledby="experience-title"
  >
    <div class="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="mb-2 text-sm font-semibold text-primary">
          Powered by Rune-Lab
        </p>
        <h2 id="experience-title" class="text-3xl font-semibold tracking-tight">
          Make yourself at home.
        </h2>
      </div>
      <p class="max-w-sm text-sm leading-relaxed opacity-70">
        Try the theme and language controls in the header, then explore the
        tools below.
      </p>
    </div>
    <div class="grid gap-4 md:grid-cols-2">
      <article class="card border border-base-300 bg-base-100">
        <div class="card-body gap-4 p-6">
          <h3 class="card-title">Your workspace, your way</h3>
          <p class="opacity-70">
            Open commands, adjust your preferences, or send yourself a small
            hello.
          </p>
          <div class="card-actions mt-2 flex-wrap">
            <button
              type="button"
              class="btn btn-primary btn-sm"
              onclick={() => registry.open("commands")}>Commands</button
            >
            <button
              type="button"
              class="btn btn-outline btn-sm"
              onclick={() => registry.open("settings")}>Settings</button
            >
            <button
              type="button"
              class="btn btn-ghost btn-sm"
              onclick={sayHello}>Say hello</button
            >
          </div>
        </div>
      </article>
      <article class="card border border-base-300 bg-base-100">
        <div class="card-body gap-4 p-6">
          <h3 class="card-title">Connection status</h3>
          <p class="opacity-70">Check the connection whenever you need it.</p>
          <div class="mt-2 min-w-0 overflow-x-auto rounded-box bg-base-200 p-3">
            <APIMonitor />
          </div>
        </div>
      </article>
    </div>
  </section>
</div>

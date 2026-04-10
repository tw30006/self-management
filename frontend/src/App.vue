<template>
  <div class="min-h-screen bg-slate-50 text-slate-900">
    <header class="border-b border-slate-200 bg-white">
      <div
        class="mx-auto flex max-w-5xl items-center justify-between px-4 py-4"
      >
        <h1 class="text-lg font-semibold">Self Management</h1>
        <nav class="flex gap-4 text-sm">
          <RouterLink class="text-slate-600 hover:text-slate-900" to="/"
            >Home</RouterLink
          >
          <RouterLink
            class="text-slate-600 hover:text-slate-900"
            to="/trainings/new"
            >New Training</RouterLink
          >
        </nav>
      </div>
    </header>

    <main class="mx-auto max-w-5xl px-4 py-8">
      <RouterView />
    </main>
  </div>
</template>

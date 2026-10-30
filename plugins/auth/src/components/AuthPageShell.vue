<template>
  <div class="auth-shell">
    <aside class="auth-shell__brand" aria-label="Ingot">
      <div class="auth-shell__wordmark">
        <AuthBrandLogo />
        <span>Ingot</span>
      </div>
      <div class="auth-shell__intro">
        <p class="auth-shell__eyebrow">专注业务 · 高效协同</p>
        <h2>让每一份工作，<br />有序展开。</h2>
        <p class="auth-shell__description">从这里进入你的管理空间，开启高效的一天。</p>
      </div>
      <div class="auth-shell__art" aria-hidden="true">
        <div class="auth-shell__orbit auth-shell__orbit--outer" />
        <div class="auth-shell__orbit auth-shell__orbit--inner" />
        <div class="auth-shell__art-mark"><AuthBrandLogo /></div>
        <div class="auth-shell__art-node auth-shell__art-node--one"><i /><i /><i /></div>
        <div class="auth-shell__art-node auth-shell__art-node--two"><i /><i /><i /></div>
        <span class="auth-shell__dot auth-shell__dot--one" />
        <span class="auth-shell__dot auth-shell__dot--two" />
      </div>
      <span class="auth-shell__brand-footer">简单 · 有序 · 从容</span>
    </aside>

    <div class="auth-shell__workspace">
      <main class="auth-shell__main">
        <section class="auth-shell__panel" aria-labelledby="auth-page-title">
          <slot />
        </section>
      </main>
      <footer class="auth-shell__copyright">{{ session.appearance.copyright }}</footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthSession } from "../session";
import AuthBrandLogo from "./AuthBrandLogo.vue";

const session = useAuthSession();
</script>

<style scoped lang="postcss">
.auth-shell {
  display: grid;
  grid-template-columns: minmax(320px, 42%) minmax(0, 1fr);
  min-height: 100vh;
  min-height: 100svh;
  background: var(--in-bg-color-canvas);
}

.auth-shell__brand {
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 40px clamp(32px, 4vw, 64px) 28px;
  border-right: 1px solid var(--in-auth-brand-border);
  background:
    radial-gradient(ellipse at 0% 0%, var(--in-auth-brand-glow), transparent 65%),
    linear-gradient(150deg, var(--in-auth-brand-bg), var(--in-bg-color-canvas));
}

.auth-shell__wordmark {
  display: flex;
  align-items: center;
  gap: var(--in-space-3);
  color: var(--in-text-color);
  font-size: 24px;
  font-weight: 600;
  letter-spacing: -0.5px;

  & .auth-brand-logo {
    width: 36px;
    height: 36px;
  }
}

.auth-shell__intro {
  position: relative;
  z-index: 1;
  margin-top: clamp(56px, 12vh, 128px);

  & h2 {
    margin: var(--in-space-4) 0;
    color: var(--in-text-color);
    font-size: clamp(30px, 3vw, 44px);
    line-height: 1.45;
    font-weight: 600;
    letter-spacing: -1px;
  }
}

.auth-shell__eyebrow {
  margin: 0;
  color: var(--in-color-primary);
  font-size: var(--in-font-size-caption);
  font-weight: 500;
  letter-spacing: 3px;
}

.auth-shell__description {
  max-width: 320px;
  margin: 0;
  color: var(--in-text-color-secondary);
  line-height: 1.8;
}

.auth-shell__art {
  position: relative;
  flex: 1 0 240px;
  width: min(100%, 360px);
  min-height: 240px;
  margin: 32px auto;
}

.auth-shell__orbit {
  position: absolute;
  top: 50%;
  left: 50%;
  border: 1px solid var(--in-auth-brand-border);
  border-radius: 32%;
  transform: translate(-50%, -50%) rotate(-18deg);
}

.auth-shell__orbit--outer {
  width: 260px;
  height: 200px;
}

.auth-shell__orbit--inner {
  width: 196px;
  height: 146px;
  transform: translate(-50%, -50%) rotate(18deg);
}

.auth-shell__art-mark {
  position: absolute;
  top: 50%;
  left: 50%;
  display: grid;
  place-items: center;
  width: 100px;
  height: 100px;
  border: 1px solid var(--in-auth-brand-border);
  border-radius: 24px;
  background: var(--in-bg-color-surface);
  box-shadow: var(--in-shadow-md);
  transform: translate(-50%, -50%) rotate(-8deg);

  & .auth-brand-logo {
    width: 64px;
    height: 64px;
    transform: rotate(8deg);
  }
}

.auth-shell__art-node {
  position: absolute;
  display: flex;
  flex-direction: column;
  gap: var(--in-space-2);
  width: 76px;
  padding: var(--in-space-4);
  border: 1px solid var(--in-auth-brand-border);
  border-radius: var(--in-radius-card-lg);
  background: var(--in-bg-color-surface);
  box-shadow: var(--in-shadow-sm);

  & i {
    height: 5px;
    border-radius: 4px;
    background: var(--in-auth-brand-glow);
  }

  & i:first-child {
    width: 26px;
    height: 26px;
    margin-bottom: var(--in-space-1);
    border-radius: 8px;
  }

  & i:last-child {
    width: 70%;
  }
}

.auth-shell__art-node--one {
  top: 0;
  right: 0;
  transform: rotate(6deg);
}

.auth-shell__art-node--two {
  bottom: 0;
  left: 0;
  transform: rotate(-6deg);
}

.auth-shell__dot {
  position: absolute;
  width: 10px;
  height: 10px;
  border: 3px solid var(--in-bg-color-surface);
  border-radius: 50%;
  background: var(--in-color-primary);
}

.auth-shell__dot--one {
  top: 20%;
  left: 10%;
}

.auth-shell__dot--two {
  right: 12%;
  bottom: 12%;
}

.auth-shell__brand-footer {
  color: var(--in-text-color-placeholder);
  font-size: var(--in-font-size-caption);
  letter-spacing: 3px;
}

.auth-shell__workspace {
  display: flex;
  min-width: 0;
  flex-direction: column;
}

.auth-shell__main {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  min-width: 0;
  padding: 56px 32px 32px;
}

.auth-shell__panel {
  width: 100%;
  max-width: var(--in-auth-panel-width);
  padding: 40px;
  border: 1px solid var(--in-border-color-light);
  border-radius: var(--in-radius-card-lg);
  background: var(--in-bg-color-surface);
  box-shadow: var(--in-shadow-sm);
}

.auth-shell__copyright {
  padding: var(--in-space-5) var(--in-space-6) var(--in-space-6);
  color: var(--in-text-color-placeholder);
  font-size: var(--in-font-size-caption);
  line-height: var(--in-line-height-caption);
  text-align: center;
  overflow-wrap: anywhere;
}

@media (max-width: 1023px) {
  .auth-shell {
    grid-template-columns: minmax(0, 1fr);
  }

  .auth-shell__brand {
    display: none;
  }
}

@media (max-width: 480px) {
  .auth-shell__main {
    padding: 32px var(--in-space-4) var(--in-space-4);
  }

  .auth-shell__panel {
    padding: var(--in-space-6);
  }
}

@media (min-width: 1024px) and (max-height: 760px) {
  .auth-shell__intro {
    margin-top: var(--in-space-8);

    & h2 {
      font-size: 32px;
    }
  }

  .auth-shell__art {
    flex-basis: 200px;
    min-height: 200px;
    margin-block: var(--in-space-6);
  }
}

@media (max-width: 360px) {
  .auth-shell__panel {
    padding: var(--in-space-5);
  }
}
</style>

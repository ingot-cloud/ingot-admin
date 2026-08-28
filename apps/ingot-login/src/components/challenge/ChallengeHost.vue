<template>
  <Verify
    v-if="active"
    ref="verifyRef"
    mode="pop"
    captcha-type="blockPuzzle"
    :img-size="{ width: '330px', height: '155px' }"
    :captcha-get-url="captchaGetUrl"
    :captcha-check-url="captchaCheckUrl"
    :vc-scope="challenge?.scope"
    :scope-param="challenge?.scopeParam"
    :pass-token-param="challenge?.passTokenParam"
    @success="privateOnSuccess"
    @close="privateOnClose"
  />
</template>

<script setup lang="ts">
import Verify from "@/components/verifition/Verify.vue";
import {
  bindChallengeSolver,
  unbindChallengeSolver,
  buildCaptchaCheckPath,
  buildCaptchaGetPath,
  type ChallengeRequiredData,
} from "@ingot/utils";

interface VerifySuccessPayload {
  passToken?: string;
}

interface PendingChallenge {
  data: ChallengeRequiredData;
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}

const verifyRef = ref();
const pending = ref<PendingChallenge | null>(null);
const settled = ref(false);

const active = computed(() => Boolean(pending.value));
const challenge = computed(() => pending.value?.data);
const captchaGetUrl = computed(() =>
  challenge.value ? buildCaptchaGetPath(challenge.value.vcType) : "",
);
const captchaCheckUrl = computed(() =>
  challenge.value ? buildCaptchaCheckPath(challenge.value.checkPath) : "",
);

const privateSolve = (data: ChallengeRequiredData): Promise<string> => {
  return new Promise((resolve, reject) => {
    settled.value = false;
    pending.value = { data, resolve, reject };
    nextTick(() => {
      verifyRef.value?.show();
    });
  });
};

const privateSettle = (error?: Error, token?: string): void => {
  const current = pending.value;
  if (!current || settled.value) {
    return;
  }
  settled.value = true;
  pending.value = null;
  if (token) {
    current.resolve(token);
    return;
  }
  current.reject(error ?? new Error("已取消安全验证"));
};

const privateOnSuccess = (payload: VerifySuccessPayload): void => {
  if (!payload.passToken) {
    privateSettle(new Error("未返回通行令牌"));
    return;
  }
  privateSettle(undefined, payload.passToken);
};

const privateOnClose = (): void => {
  privateSettle();
};

onMounted(() => {
  bindChallengeSolver(privateSolve);
});

onBeforeUnmount(() => {
  unbindChallengeSolver(privateSolve);
  privateSettle();
});
</script>

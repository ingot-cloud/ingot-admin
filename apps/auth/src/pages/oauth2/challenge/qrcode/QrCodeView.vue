<template>
  <div class="qrcode-box">
    <div class="title-container">
      <img class="logo-image" src="@/assets/logo.png" />
      <div class="login-title">{{ login.qrcodeTitle }}</div>
      <div class="login-desc">{{ login.desc }}</div>
    </div>

    <in-qrcode :options="options" />
  </div>
</template>
<script lang="ts" setup>
import {
  QrcodeType,
  OptionsPosType,
  CorrectLevel,
  LineOptionsType,
  RoundOptionsType,
} from "@/components/qrcode";
import { useAppStore } from "@/stores/modules/app";

const { login } = useAppStore();

const options = reactive({
  text: "Ingot",
  correctLevel: CorrectLevel.P15,
  width: 280,
  height: 280,
  isSpace: true,

  type: QrcodeType.Round,
  lineOptionsType: LineOptionsType.VerticalHorizontal,
  roundOptionsType: RoundOptionsType.Circular,
  size: 80, // 码点大小
  opacity: 70, // 透明度
  posType: OptionsPosType.RoundedRectangle, // 码眼样式
  otherColor: "#000000", // 码点颜色
  posColor: "#000000", // 码眼颜色
});
</script>
<style scoped lang="postcss">
.qrcode-box {
  padding-top: 70px;
  display: flex;
  flex-direction: column;
  align-items: center;

  & .title-container {
    font-size: 18px;
    font-weight: 400;
    color: var(--in-text-color-secondary);
    display: flex;
    flex-direction: column;
    align-items: center;

    & .logo-image {
      width: 48px;
      height: 48px;
    }

    & .login-title {
      margin: 10px auto 0;
      line-height: 30px;
      font-size: 20px;
      color: #171a1d;
      text-align: center;
      font-weight: bold;
    }

    & .login-desc {
      margin: 0 auto;
      line-height: 30px;
      font-size: 16px;
      color: #171a1d;
      text-align: center;
    }
  }
}
</style>

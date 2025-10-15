<template>
  <in-filter-container>
    <template #left>
      <div class="qrcode-config">
        <div class="in-custom-title">
          <div class="rect" />
          <div class="title">二维码配置</div>
        </div>
        <el-form ref="editFormRef" class="form" label-width="100px" :model="editForm">
          <el-form-item label="二维码样式">
            <in-select w-full v-model="editForm.type" :options="qrcodeTypeEnum.getOptions()" />
          </el-form-item>
          <el-form-item label="容错率">
            <in-select
              w-full
              v-model="editForm.correctLevel"
              :options="correctLevelEnum.getOptions()"
            />
          </el-form-item>
          <el-form-item label="码点样式" v-if="editForm.type == QrcodeType.Line">
            <in-select
              w-full
              v-model="editForm.lineOptionsType"
              :options="lineOptionsTypeEnum.getOptions()"
            />
          </el-form-item>
          <el-form-item label="码点样式" v-if="editForm.type == QrcodeType.Round">
            <in-select
              w-full
              v-model="editForm.roundOptionsType"
              :options="roundOptionsTypeEnum.getOptions()"
            />
          </el-form-item>
          <el-form-item label="码眼样式">
            <in-select
              w-full
              v-model="editForm.posType"
              :options="optionsPosTypeEnum.getOptions()"
            />
          </el-form-item>
          <el-form-item label="码点大小">
            <el-input type="number" v-model="editForm.size" placeholder="请输入码点大小"></el-input>
          </el-form-item>
          <el-form-item label="透明度">
            <el-input
              type="number"
              v-model="editForm.opacity"
              placeholder="请输入透明度"
            ></el-input>
          </el-form-item>
          <el-form-item label="码点颜色">
            <div flex flex-row gap-2 items-center w-full>
              <in-copy-tag
                effect="dark"
                :color="editForm.otherColor"
                flex-1
                :text="editForm.otherColor"
              />
              <el-color-picker v-model="editForm.otherColor" />
            </div>
          </el-form-item>
          <el-form-item label="码眼颜色">
            <div flex flex-row gap-2 items-center w-full>
              <in-copy-tag
                effect="dark"
                :color="editForm.posColor"
                flex-1
                :text="editForm.posColor"
              />
              <el-color-picker v-model="editForm.posColor" />
            </div>
          </el-form-item>
          <el-form-item label="二维码大小">
            <el-input
              type="number"
              v-model="qrcodeSize"
              clearable
              placeholder="请输入二维码大小"
            ></el-input>
          </el-form-item>
          <el-form-item label="二维码内容">
            <el-input
              v-model="editForm.text"
              :autosize="{ minRows: 3, maxRows: 6 }"
              type="textarea"
              placeholder="请输入二维码内容"
              clearable
            />
          </el-form-item>
        </el-form>
      </div>
    </template>

    <div h-full flex flex-col items-center justify-center>
      <in-qrcode :options="editForm" ref="QrcodeRef" />

      <div flex flex-row>
        <in-button type="primary" @click="handleDownload(true)"> 下载SVG </in-button>
        <in-button type="primary" @click="handleDownload(false)"> 下载图片 </in-button>
      </div>
    </div>
  </in-filter-container>
</template>
<script setup lang="ts">
import {
  useQrcodeTypeEnum,
  useCorrectLevelEnum,
  useLineOptionsTypeEnum,
  useRoundOptionsTypeEnum,
  useOptionsPosTypeEnum,
  QrcodeType,
  OptionsPosType,
  CorrectLevel,
  LineOptionsType,
  RoundOptionsType,
} from "@/components/qrcode";
import { saveSvg, saveImg } from "@ingot/utils";

const QrcodeRef = ref();
const qrcodeSize = computed<number>({
  set(value) {
    editForm.width = `${value}`;
    editForm.height = `${value}`;
  },
  get() {
    return Number(editForm.width);
  },
});
const editForm = reactive({
  text: import.meta.env.VITE_APP_TITLE,
  correctLevel: CorrectLevel.P15,
  width: "400",
  height: "400",
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
const qrcodeTypeEnum = useQrcodeTypeEnum();
const correctLevelEnum = useCorrectLevelEnum();
const lineOptionsTypeEnum = useLineOptionsTypeEnum();
const roundOptionsTypeEnum = useRoundOptionsTypeEnum();
const optionsPosTypeEnum = useOptionsPosTypeEnum();
const handleDownload = (isSvg: boolean) => {
  if (isSvg) {
    saveSvg(`${editForm.type}`, QrcodeRef.value.getValue());
  } else {
    saveImg(`${editForm.type}`, QrcodeRef.value.getValue(), editForm.width, editForm.height, "png");
  }
};
</script>
<style scoped lang="postcss">
.qrcode-config {
  @apply w-300px flex flex-col gap-10px;

  & .in-custom-title {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 10px;
    grid-gap: 10px;
    padding-bottom: var(--in-common-padding);
    border-bottom: var(--in-border-style);
    & .rect {
      width: 4px;
      height: 14px;
      background: var(--in-color-primary);
      border-radius: 2px;
    }
    & .title {
      font-weight: bold;
      color: #192f48;
      font-size: 18px;
    }
  }
}
</style>

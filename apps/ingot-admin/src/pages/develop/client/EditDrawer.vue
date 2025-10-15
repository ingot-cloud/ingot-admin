<template>
  <in-drawer :title="title" v-model="show" padding="0">
    <in-form-group-title v-if="isEdit" title="基本信息" v-model="editFlag" />
    <div p-20px>
      <in-form
        v-loading="loading"
        ref="editFormRef"
        :model="editForm"
        :rules="rules"
        :disabled="isEdit && !editFlag"
      >
        <el-form-item v-if="isEdit" label="客户端ID" prop="clientId">
          <el-input
            :disabled="isEdit"
            v-model="editForm.clientId"
            placeholder="请输入客户端ID"
          ></el-input>
        </el-form-item>
        <el-form-item v-if="isEdit" label="客户端秘钥" prop="clientSecret">
          <in-button @click="handleResetSecret">重置秘钥</in-button>
        </el-form-item>
        <el-form-item label="客户端名称" prop="clientName">
          <el-input
            v-model="editForm.clientName"
            :disabled="isEdit"
            placeholder="请输入客户端名称"
          ></el-input>
        </el-form-item>

        <el-form-item label="访问范围">
          <el-input
            v-model="editForm.scopes"
            clearable
            placeholder="请输入客户端scope"
            class="form-item"
          ></el-input>
        </el-form-item>
        <el-form-item label="重定向URL">
          <el-input
            v-model="editForm.redirectUris"
            clearable
            placeholder="请输入重定向URL"
          ></el-input>
        </el-form-item>

        <el-form-item label="Client认证方式">
          <in-select
            w-full
            v-model="editForm.clientAuthenticationMethods"
            :options="clientAuthMethodEnum.getOptions()"
            placeholder="请选择Client认证方式"
            split=","
            multiple
          />
        </el-form-item>
        <el-form-item label="授权授予类型">
          <in-select
            w-full
            v-model="editForm.authorizationGrantTypes"
            :options="authorizedGrantTypeEnum.getOptions()"
            placeholder="请选择允许授予类型"
            split=","
            multiple
          />
        </el-form-item>

        <el-form-item label="访问Token失效时间(单位秒)">
          <el-input
            v-model="editForm.accessTokenTimeToLive"
            clearable
            type="number"
            placeholder="请输入访问Token失效时间"
          ></el-input>
        </el-form-item>
        <el-form-item label="Token认证类型">
          <in-select
            w-full
            v-model="editForm.tokenAuthType"
            :options="tokenAuthMethodEnum.getOptions()"
          />
        </el-form-item>
        <el-form-item label="刷新Token失效时间(单位秒)" v-if="grantRefreshToken">
          <el-input
            v-model="editForm.refreshTokenTimeToLive"
            clearable
            type="number"
            placeholder="请输入刷新Token失效时间"
          ></el-input>
        </el-form-item>
        <el-form-item label="重复使用刷新Token" v-if="grantRefreshToken">
          <el-switch v-model="editForm.reuseRefreshTokens" />
        </el-form-item>

        <el-form-item label="需要提供验证密钥质询和验证器" v-if="grantCode">
          <el-switch v-model="editForm.requireProofKey" />
        </el-form-item>
        <el-form-item label="需要授权同意" v-if="grantCode">
          <el-switch v-model="editForm.requireAuthorizationConsent" />
        </el-form-item>
      </in-form>
    </div>

    <template #footer>
      <in-button
        v-if="isEdit"
        type="danger"
        @click="confirmDelete.exec(id!, `是否删除客户端(${editForm.clientId})`, '删除成功')"
      >
        删除
      </in-button>
      <common-status-button
        v-if="isEdit"
        :status="editForm.status"
        @click="
          confirmStatus.exec(id!, editForm.status!, `客户端(${editForm.clientId})`, '操作成功')
        "
      />
      <in-button type="primary" @click="handleActionButton">确定</in-button>
    </template>
  </in-drawer>
  <SecretDialog ref="SecretDialogRef" />
</template>
<script setup lang="ts">
import type { OAuth2RegisteredClient, AppSecretVO } from "@/models";
import {
  useTokenAuthMethodEnum,
  useAuthorizedGrantTypeEnum,
  AuthorizedGrantType,
  useClientAuthMethodEnum,
} from "@/models/enums";
import { Message } from "@/utils/message";
import { copyParamsWithKeys, getDiffWithIgnore } from "@/utils/object";
import {
  UpdateClientAPI,
  CreateClientAPI,
  RemoveClientAPI,
  ResetClientSecretAPI,
} from "@/api/basic/client";
import SecretDialog from "./SecretDialog.vue";

const defaultEditForm: OAuth2RegisteredClient = {
  id: undefined,
  clientId: undefined,
  clientIdIssuedAt: undefined,
  clientSecret: undefined,
  clientName: undefined,
  clientAuthenticationMethods: undefined,
  authorizationGrantTypes: undefined,
  redirectUris: undefined,
  scopes: undefined,
  requireProofKey: undefined,
  requireAuthorizationConsent: undefined,
  accessTokenTimeToLive: undefined,
  reuseRefreshTokens: undefined,
  refreshTokenTimeToLive: undefined,
  idTokenSignatureAlgorithm: undefined,
  tokenAuthType: undefined,
  status: undefined,
};

const confirmStatus = useConfirmStatus(transformUpdateAPI(UpdateClientAPI), () => {
  emits("success");
});

const confirmDelete = useConfirmDelete(transformDeleteAPI(RemoveClientAPI), () => {
  emits("success");
  show.value = false;
});

const authorizedGrantTypeEnum = useAuthorizedGrantTypeEnum();
const tokenAuthMethodEnum = useTokenAuthMethodEnum();
const clientAuthMethodEnum = useClientAuthMethodEnum();
const confirm = useMessageConfirm();
const SecretDialogRef = ref();

const keys = Object.keys(defaultEditForm).filter((key) => key != "id");

const editFlag = ref(false);
const title = ref("");
const show = ref(false);
const id = ref();

const rules = {
  clientId: [{ required: true, message: "请输入客户端ID", trigger: "blur" }],
  clientName: [{ required: true, message: "请输入客户端名称", trigger: "blur" }],
  scopes: [{ required: true, message: "请输入客户端访问范围", trigger: "blur" }],
  clientAuthenticationMethods: [
    { required: true, message: "请选择客户端认证方式", trigger: "blur" },
  ],
  authorizationGrantTypes: [{ required: true, message: "请选择客户端授权类型", trigger: "blur" }],
};

const emits = defineEmits(["success"]);

const editFormRef = ref();
const editForm = reactive(Object.assign({}, defaultEditForm));
const rawEditForm = Object.assign({}, defaultEditForm);
const loading = ref(false);
const isEdit = ref(false);

const grantRefreshToken = computed(() => {
  return (
    editForm.authorizationGrantTypes &&
    (editForm.authorizationGrantTypes as string).indexOf(AuthorizedGrantType.RefreshToken) > -1
  );
});

const grantCode = computed(() => {
  return (
    editForm.authorizationGrantTypes &&
    (editForm.authorizationGrantTypes as string).indexOf(AuthorizedGrantType.Code) > -1
  );
});

const handleActionButton = () => {
  const form = unref(editFormRef);
  form.validate((valid: boolean) => {
    if (valid) {
      const params = getDiffWithIgnore(rawEditForm, editForm);
      if (Object.keys(params).length === 0) {
        Message.warning("未改变数据");
        return;
      }
      let request;
      if (isEdit.value) {
        params.id = id.value;
        request = UpdateClientAPI(params);
      } else {
        request = CreateClientAPI(params);
      }

      loading.value = true;
      request
        .then((response) => {
          // 创建成功，显示秘钥
          if (!isEdit.value) {
            SecretDialogRef.value.show(
              (response.data as AppSecretVO).appId!,
              (response.data as AppSecretVO).appSecret!,
            );
          }
          Message.success("操作成功");
          emits("success");
          show.value = false;
          loading.value = false;
        })
        .catch(() => {
          loading.value = false;
        });
    }
  });
};

const handleResetSecret = () => {
  confirm.warning("是否重置该应用秘钥?").then(() => {
    ResetClientSecretAPI(id.value).then((response) => {
      SecretDialogRef.value.show(response.data.appId!, response.data.appSecret!);
    });
  });
};

defineExpose({
  show(data?: OAuth2RegisteredClient) {
    isEdit.value = Boolean(data);
    show.value = true;
    // 重置数据
    copyParamsWithKeys(editForm, defaultEditForm, keys);
    copyParamsWithKeys(rawEditForm, defaultEditForm, keys);

    nextTick(() => {
      const form = unref(editFormRef);
      form.resetFields();

      if (isEdit.value) {
        id.value = data?.id!;
        title.value = data?.clientName!;
        copyParamsWithKeys(editForm, data!, keys);
        copyParamsWithKeys(rawEditForm, data!, keys);
      } else {
        title.value = "添加客户端";
      }
    });
  },
});
</script>

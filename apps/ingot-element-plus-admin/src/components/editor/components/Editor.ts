/**
 * Copyright (c) 2018-present, Ephox, Inc.
 *
 * This source code is licensed under the Apache 2 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { ScriptLoader } from "../ScriptLoader";
import { getTinymce } from "../TinyMCE";
import {
  isTextarea,
  mergePlugins,
  uuid,
  // isNullOrUndefined,
  initEditor,
} from "../Utils";
import { editorProps } from "./EditorPropTypes";
import type { IPropTypes } from "./EditorPropTypes";
import type { Ref } from "vue";
import type { Editor as TinyMCEEditor, EditorEvent, TinyMCE } from "tinymce";

const defaultMenubar = "file edit view insert format tools table help";
const defaultToolbar =
  "undo redo | bold italic underline strikethrough | fontfamily fontsize blocks | alignleft aligncenter alignright alignjustify | outdent indent |  numlist bullist | forecolor backcolor removeformat | pagebreak | charmap emoticons | fullscreen  preview save print | insertfile image media template link anchor codesample | ltr rtl";
const defaultPlugins =
  "preview importcss searchreplace autolink autosave save directionality code visualblocks visualchars fullscreen image link media template codesample table charmap pagebreak nonbreaking anchor insertdatetime advlist lists wordcount help charmap quickbars emoticons";

type EditorOptions = Parameters<TinyMCE["init"]>[0];

const renderInline = (ce: any, id: string, elementRef: Ref<Element | null>, tagName?: string) =>
  ce(tagName ? tagName : "div", {
    id,
    ref: elementRef,
  });

const renderIframe = (ce: any, id: string, elementRef: Ref<Element | null>) =>
  ce("textarea", {
    id,
    visibility: "hidden",
    ref: elementRef,
  });

export const Editor = defineComponent({
  props: editorProps,
  setup: (props: IPropTypes, ctx) => {
    let conf = props.init ? { ...props.init } : {};
    const { disabled, modelValue, tagName } = toRefs(props);
    const element: Ref<Element | null> = ref(null);
    let vueEditor: any = null;
    const elementId: string = props.id || uuid("tiny-vue");
    const inlineEditor: boolean = (props.init && props.init.inline) || props.inline;
    const modelBind = !!ctx.attrs["onUpdate:modelValue"];
    let mounting = true;
    const initialValue: string = props.initialValue ? props.initialValue : "";
    let cache = "";

    const getContent = (isMounting: boolean): (() => string) =>
      modelBind
        ? () => (modelValue?.value ? modelValue.value : "")
        : () => (isMounting ? initialValue : cache);
    const isDark = useDark();

    const initWrapper = (): void => {
      const content = getContent(mounting);

      const publicPath = import.meta.env.VITE_PUBLIC_PATH || "/";
      const skinName = isDark ? "oxide-dark" : "oxide";
      const finalInit = {
        ...conf,
        readonly: props.disabled,
        target: element.value,
        plugins: mergePlugins(conf.plugins, props.plugins || defaultPlugins),
        promotion: false, // 去掉高级功能升级按钮
        language_url: publicPath + "resource/tinymce/langs/zh_CN.js",
        language: "zh_CN",
        branding: false,
        default_link_target: "_blank",
        link_title: false,
        skin: skinName,
        skin_url: publicPath + "resource/tinymce/skins/ui/" + skinName,
        content_css: isDark ? "dark" : "default",
        menubar: defaultMenubar,
        toolbar: props.toolbar || conf.toolbar || defaultToolbar,
        autosave_ask_before_unload: true,
        autosave_interval: "30s",
        autosave_prefix: "{path}{query}-{id}-",
        autosave_restore_when_empty: false,
        autosave_retention: "2m",
        inline: inlineEditor,
        setup: (editor: TinyMCEEditor) => {
          vueEditor = editor;
          editor.on("init", (e: EditorEvent<any>) =>
            initEditor(e, props, ctx, editor, modelValue, content),
          );
          if (typeof conf.setup === "function") {
            conf.setup(editor);
          }
        },
      };
      if (isTextarea(element.value)) {
        element.value.style.visibility = "";
      }
      getTinymce().init(finalInit);
      mounting = false;
    };
    watch(disabled, (disable) => {
      if (vueEditor !== null) {
        if (typeof vueEditor.mode?.set === "function") {
          vueEditor.mode.set(disable ? "readonly" : "design");
        } else {
          vueEditor.setMode(disable ? "readonly" : "design");
        }
      }
    });
    watch(tagName, () => {
      if (!modelBind) {
        cache = vueEditor.getContent();
      }
      getTinymce()?.remove(vueEditor);
      nextTick(() => initWrapper());
    });
    onMounted(() => {
      if (getTinymce() !== null) {
        initWrapper();
      } else if (element.value && element.value.ownerDocument) {
        // const channel = props.cloudChannel ? props.cloudChannel : "6";
        // const apiKey = props.apiKey ? props.apiKey : "no-api-key";
        // const scriptSrc: string = isNullOrUndefined(props.tinymceScriptSrc)
        //   ? `https://cdn.tiny.cloud/1/${apiKey}/tinymce/${channel}/tinymce.min.js`
        //   : props.tinymceScriptSrc;
        // 使用本地文件
        const scriptSrc =
          (import.meta.env.VITE_PUBLIC_PATH || "/") + "resource/tinymce/tinymce.min.js";
        ScriptLoader.load(element.value.ownerDocument, scriptSrc, initWrapper);
      }
    });
    onBeforeUnmount(() => {
      if (getTinymce() !== null) {
        getTinymce().remove(vueEditor);
      }
    });
    if (!inlineEditor) {
      onActivated(() => {
        if (!mounting) {
          initWrapper();
        }
      });
      onDeactivated(() => {
        if (!modelBind) {
          cache = vueEditor.getContent();
        }
        getTinymce()?.remove(vueEditor);
      });
    }
    const rerender = (init: EditorOptions) => {
      cache = vueEditor.getContent();
      getTinymce()?.remove(vueEditor);
      conf = { ...conf, ...init };
      nextTick(() => initWrapper());
    };
    ctx.expose({
      rerender,
    });
    return () =>
      inlineEditor
        ? renderInline(h, elementId, element, props.tagName)
        : renderIframe(h, elementId, element);
  },
});

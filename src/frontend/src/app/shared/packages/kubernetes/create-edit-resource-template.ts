import { NgForm } from '@angular/forms';
import { ViewChild } from '@angular/core';
import { App } from '../../model/v1/app';
import { ActionType, appLabelKey, namespaceLabelKey } from '../../shared.const';
import { Location } from '@angular/common';
import { AppService } from '../../client/v1/app.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { AceEditorService } from '../../ace-editor/ace-editor.service';
import { MessageHandlerService } from '../../message-handler/message-handler.service';
import { CacheService } from '../../auth/cache.service';
import { AceEditorMsg } from '../../ace-editor/ace-editor';
import { mergeDeep } from '../../utils';

export class CreateEditResourceTemplate {
  ngForm: NgForm;
  @ViewChild('ngForm')
  currentForm: NgForm;


  checkOnGoing = false;
  isSubmitOnGoing = false;
  actionType: ActionType;
  app: App;

  template: any;
  resource: any;
  kubeResource: any;
  defaultKubeResource: any;

  resourceType: string;



  constructor(
    private templateService: any,
    private resourceService: any,
    public location: Location,
    public router: Router,
    public appService: AppService,
    public route: ActivatedRoute,
    public authService: AuthService,
    public cacheService: CacheService,
    public aceEditorService: AceEditorService,
    public messageHandlerService: MessageHandlerService
  ) {
  }

  registResourceType(resourceType: string) {
    this.resourceType = resourceType;
  }

  registDefaultKubeResource(kubeResource: any) {
    this.defaultKubeResource = kubeResource;
  }

  // 监听退出事件
  onCancel() {
    this.currentForm.reset();
    this.location.back();
  }

  // 监听提交表单的事件
  onSubmit() {
    if (this.isSubmitOnGoing) {
      return;
    }
    this.isSubmitOnGoing = true;

    let resourceObj = JSON.parse(JSON.stringify(this.kubeResource));
    resourceObj = this.generateResource(resourceObj);
    this.template.ingressId = this.resource.id;
    this.template.template = JSON.stringify(resourceObj);

    this.template.id = undefined;
    this.template.name = this.resource.name;
    this.templateService.create(this.template, this.app.id).subscribe(
      status => {
        this.isSubmitOnGoing = false;
        this.router.navigate(
          [`portal/namespace/${this.cacheService.namespaceId}/app/${this.app.id}/${this.resourceType}/${this.resource.id}`]
        );
        // TODO 路由变化后下面不会生效
        this.messageHandlerService.showSuccess('创建' + this.resourceType + '模板成功！');
      },
      error => {
        this.isSubmitOnGoing = false;
        this.messageHandlerService.handleError(error);

      }
    );
  }

  // 监听打开 Modal
  onOpenModal(): void {
    let resourceObj = JSON.parse(JSON.stringify(this.kubeResource));
    resourceObj = this.generateResource(resourceObj);
    this.aceEditorService.announceMessage(AceEditorMsg.Instance(resourceObj, true));
  }

  // 处理资源（挂载系统 label 等）
  generateResource(kubeResource: any): any {
    kubeResource.metadata.name = this.resource.name;
    kubeResource.metadata.labels = this.generateLabels(this.kubeResource.metadata.labels);
    return kubeResource;
  }

  // 处理系统定义的 label
  generateLabels(labels: {}) {
    if (!labels) {
      labels = {};
    }
    labels[this.authService.config[appLabelKey]] = this.app.name;
    labels[this.authService.config[namespaceLabelKey]] = this.cacheService.currentNamespace.name;
    labels['app'] = this.resource.name;
    return labels;
  }

  saveResourceTemplate() {
    this.kubeResource = mergeDeep(JSON.parse(this.defaultKubeResource), JSON.parse( this.template.template));
  }

  public get isValid(): boolean {
    return this.currentForm &&
      this.currentForm.valid &&
      !this.isSubmitOnGoing &&
      !this.checkOnGoing && this.isValidResource();
  }

  isValidResource(): boolean {
    if (this.kubeResource === null) {
      return false;
    }
    return true;
  }
}

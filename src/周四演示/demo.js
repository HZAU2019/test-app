import React, {
    FC,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
  } from 'react';
  import { observer } from 'mobx-react';
  import StoreContext from '~/stores';
  import {
    ECompassAssetNode,
    ECompassDomain,
    District,
  } from '~/stores/AssetStore';
  import i18n from '~/locales';
  import Header from '~/components/Header';
  import Modal from '~/components/Modal';
  
  import { Toast, Depth, DomainType, Loading, Drawer } from 'mobile-components';
  
  import WithAssetFilter, {
    useAssetFilterOnOff,
  } from '~/components/WithAssetFilter';
  import { useParams } from 'react-router-dom';
  import { device,Router } from '@enos/envhybrid-utils';
  
  //@ts-ignore
  import DtvSDK from 'enos-dtv-sdk';
  
  import './index.less';
  import addIcon from '~/assets/imgs/green_add.png';
  import env from '~/utils/env';
  import persistService from '~/services/persistSevice';
  
  let dtvSDK = null;
  
  
  
  function groupMdmIdFormatter(domain, mdmidArr){
    return `${mdmidArr.join(',')}:${domain}`
  }
  /* 
   sample url for ref purpose
    '/dt-fe/index.html?dtv_access_token=APP_PORTAL_S_fH2GG8hwpxxx#/dt/encompass/page/eff85a9c-1b4f-42c2-8672-bb46a3118e44';
    'https://localhost:3000/dt/encompass/page/eff85a9c-1b4f-42c2-8672-bb46a3118e44';
  
  devtool  open page on app : ppe 环境
  
    plugins.ShellRouterPlugin.pushState(console.log,console.log,'/mobile-encompass/index.html#/dtv/page/766ef11c-5ccb-4570-9ce0-4aae0b05300e',{title:"dt22v"})  
  
    */
  const DtvHost= observer(function (props) {
    // templateId 对应这个各个领域组合其他条件 匹配到的模版id
    const { prefixCls,title,children,params,isEditBut=true,isClick, pageId:templateId } = props;
    const { assetStore } = useContext(StoreContext);
    const [pageId, setPageId] = useState<string>(templateId || '');
  
    // 编辑模式
    const [isInEditMode, setEditMode] = useState<boolean>(false);
    // 添加组件面板
    const [isWidgetListOpen, setWidgetListOpen] = useState<boolean>(false);
    // 添加组件面板中的加载状态
    const [isWidgetListLoading, setWidgetListLoading] = useState<boolean>(false);
    // 覆盖 整个页面的loading
    const [isGlobalLoading, setGlobalLoading] = useState<boolean>(false);
  // 是否显示 对话框
    const [showCancelConfirmModal, setCancleModalVisiable] = useState<boolean>(false);
    const [showDeleteConfirmModal, setDeleteModalVisiable] = useState<boolean>(false);
  
    const [[widgetId,widgetType], setWidget2Del] = useState<[string,string]>(['','']);
  
  
  
    const [widgetTemplates, setWidgetTemplates] = useState<
      Array<{ idwidgetTemplateName: string }>
    ([]);
    const onOff = useAssetFilterOnOff();
  
  
    useEffect(()=>{
      setPageId(templateId)
    },[templateId])
  
    const persistParams= useMemo(()=>{
      return {
        objId: `${env.userId}`,
        objType: 'mobile-dtvPageIdRecd',
        persistenceId: `${templateId}`, // 模版的pageid
        persistenceType: `${env.orgId}`,
      }
    },[templateId])
  
    // iframe的url
    const url = useMemo(() => {
      if (device.isShell) {
        localStorage.setItem("dtv_access_token", env.accessToken)
        //需要搭载有dt-fe的包  ?dtv_access_token=${env.accessToken}
        return `dt-fe/index.html?dtv_access_token=${env.accessToken}&_responsive_mode_=mb#/dt/encompass/page/${pageId}`;
      }
      //  for local test
      if (process.env.NODE_ENV === 'development') {
        console.log(`######### pageId:${pageId}`)
        return `http://localhost:3000/dt/encompass/page/${pageId}?_responsive_mode_=mb`;
      }
    }, [pageId]);
  
    const iframeRef = useRef<HTMLIFrameElement>(null);
  
    /**
     * mdmId1,mdmId2,mdmId3:group1|mdmId4,mdmId5:group2
     * 格式如上，｜分隔分组，：分隔对象列表和对象分组
     */
    const mdmIdGroupMap = useMemo<{
      onlyGroupAll,
      onlyDomainGroup,
      allInOne
    }>(() => {
      if (assetStore.selectedNode.id === 'NA') {
        return {
          onlyGroupAll:'',
          onlyDomainGroup: '',
          allInOne: ''
    
        } ;
      }
  
      const map = assetStore.domains.reduce((map, current) => {
        map[current.domain] = [];
        return map;
      });
  
      function extractMdmId(node) {
        switch (node.district) {
          case District.GROUP:
            node.children?.forEach((child) => {
              extractMdmId(child);
            });
            break;
          case District.AREA:
            node.children?.forEach((child) => {
              const { id, domainType } = child;
              domainType && map[domainType].push(id); // 添加到该domain
              map[DomainType.all].push(id); // 添加到all
            });
            break;
          case District.SITE:
            map[DomainType.all].push(node.id)
            break;
        }
      }
  
      extractMdmId(assetStore.selectedNode);
      console.log('map', map);
  
      if (assetStore.domainType === DomainType.all) {
        const domainMdmidStr = Object.entries(map)
          .filter(([domain])=>domain!==DomainType.all)
          .map(([domain,mdmidArr]) => groupMdmIdFormatter(domain,mdmidArr))
          .join('|');
          const onlyGroupAll = groupMdmIdFormatter(DomainType.all,map[DomainType.all]||assetStore.SiteGroupFromSelectedNode);
          return {
            onlyGroupAll,
            onlyDomainGroup: domainMdmidStr,
            allInOne:`${onlyGroupAll}|${domainMdmidStr}`
          }        
      } else {
         const currentDomain = assetStore.domainType;
         // 搜索页点击单场站跳回
         const mapSite = map[currentDomain].length ? map[currentDomain] : assetStore.SiteGroupFromSelectedNode[DomainType.all]
        const onlyGroupAll = groupMdmIdFormatter(DomainType.all,mapSite);
        const onlyDomainGroup = groupMdmIdFormatter(currentDomain,map[currentDomain]);
        const allInOne = `${onlyDomainGroup}|${onlyGroupAll}`
        return {
          onlyGroupAll,
          onlyDomainGroup,
          allInOne
        }
      }
    }, [assetStore.selectedNode, assetStore.domainType, assetStore.domains,assetStore.SiteGroupFromSelectedNode]);
  
    //初始化 SDK
    useEffect(() => {
      if(dtvSDK!=null) return;
      dtvSDK = new DtvSDK(templateId);
      dtvSDK.targetWindow = iframeRef.current?.contentWindow;
   
      dtvSDK.subscribeActions({
       
        onWidgetDelete : ({widgetId, widgetType})=>{
          setWidget2Del([widgetId, widgetType])
          setDeleteModalVisiable(true)
        }
      })
      return function () {
        dtvSDK = null;
      };
    }, []);// DtvSDK 的初始化id 是可选的
  
  
    //根据模版 获取用户潜在的修改过的页面id
    useEffect(() => {
      setGlobalLoading(true)
       
      templateId && persistService
        .query(persistParams)
        .catch(err=>[])
        .then((records) => {
          if(records && records.length>0){
            const record = records[0]
            setPageId(record.persistenceInfo)
          }/* else{
            setPageId(templateId)
          } */
          setGlobalLoading(false);
        });
   
      return function () {
       
      };
    }, [templateId, persistParams]);
  
    const reConfigDtv = useCallback(function(){
      console.log('reConfigDtv' , {
        id: pageId,
        filters: mdmIdGroupMap,
      })
      dtvSDK.changePage({
        id: pageId,
        filters: {...mdmIdGroupMap, ...params}
      });
    },[pageId, mdmIdGroupMap,params])
    
  
    // 设置参数和页面id变动
    useEffect(() => {
      reConfigDtv()
    }, [pageId, mdmIdGroupMap,params,reConfigDtv]);
    
  
    const nodeClick = useCallback((
      node,
      depth,
      domain
    )=>{
      if(props.nodeClick){
        props.nodeClick(node,depth,domain)
      }else{
        if (node.district === District.SITE) {
          Toast.info(i18n.AssetList.SITE_NOT_SUPPORT);
        } else {
          //leaf节点点击了
          assetStore.updateSelection(node, depth);
          onOff();
        }
      }
    },[props.nodeClick])
  
    const actions = {
      // 进入编辑模式
      toEditMode() {
        dtvSDK?.switchToEdit({
          disableEdit:true
        }).then(() => setEditMode(true));
      },
  
      cancleEdit() {
        dtvSDK?.cancelEdit().then(() => setEditMode(false));
      },
  
      // 保存编辑结果
      toSave() {
        setGlobalLoading(true);
        dtvSDK?.saveLayout().then((res) => {
          const newId = res?.data?.pageId;
          if (newId) {
  
            const newRecord = {...persistParams, persistenceInfo:newId}
            persistService.insert(newRecord).then(()=>{
              setEditMode(false);
              setGlobalLoading(false);
              setPageId(newId);
            }).catch(err=>{
              setGlobalLoading(false);
              Toast.show('保存失败')
            })

             
         
          }
        });
      },
      restore() {
        persistService
        .delete(persistParams)
        .finally(actions.cancleEdit)
        .then(()=>{
          setPageId(templateId)
        })
      },
      refreshPage() {
        dtvSDK?.refreshPage();
      },
      openWidgetListPanel() {
        setWidgetListOpen(true);
        setWidgetListLoading(true);
        dtvSDK?.getBusinessWidgets().then((res) => {
          setWidgetListLoading(false);
          const proj =
            res?.data?.widgetTemplates?.filter(
              (temp) => temp.name === 'Mobile'
            ) || [];
          if (proj.length > 0) {
            setWidgetTemplates(proj[0].widgetTemplates);
          }
        });
      },
    };
  
    function uiWidgetList() {
      return (
        <>
          <Loading visible={isWidgetListLoading} />
          <div className='title'>{i18n.Dtv.btnTxtAddWidget}</div>
          <div className='widgets-list'>
            {widgetTemplates.map(({ id, widgetTemplateName }) => {
              return (
                <div
                  className='list-item'
                  key={id}
                  onClick={() => {
                    dtvSDK?.addWidgetFromTemplate(id).then(()=>setWidgetListOpen(false));
                  }}
                >
                  <img src={addIcon} alt='' className='icon' />
                  <span className='name'>{widgetTemplateName}</span>
                </div>
              );
            })}
          </div>
        </>
      );
    }
  
    function uiToolBarElem() {
      return (
        <div className='tool-bar'>
          <div className='tool' onClick={actions.openWidgetListPanel}>
            <span className="map_plus"></span>{i18n.Dtv.btnTxtAddWidget}
          </div>
          <div className='tool' onClick={actions.restore}>
            {i18n.Dtv.btnTxtRestore}
          </div>
        </div>
      );
    }
  
    function uiSettingIcon() {
      return <div>
        {
          isEditBut ? <div className='map_setting' onClick={actions.toEditMode}></div> : <div></div>
        }
      </div>
      
    }
  
    function beforeBack(){
      if(isInEditMode){
        actions.cancleEdit()
        return false
      }
      return true
    }
  
    const cancleConfirmBtnConfig =[
      {  
        text:i18n.Dtv.btnTxtCancle,
        onPress:()=>{
           actions.cancleEdit()
           setCancleModalVisiable(false)
        }
      },
      {  
        text:i18n.Dtv.btnTxtConfirm,
        onPress:()=>{
          actions.toSave()
          setCancleModalVisiable(false)
        }
      } 
    ]
  
  
    const delConfirmBtnConfig =[
      {  
        text:i18n.Dtv.btnTxtCancle,
        onPress:()=>{
           setDeleteModalVisiable(false)
        }
      },
      {  
        text:i18n.Dtv.btnTxtConfirm,
        onPress:()=>{
          setDeleteModalVisiable(false)
          dtvSDK.deleteWidget(widgetId,widgetType)
        }
      } 
    ]
  
    return (
      <div className={prefixCls}>
        <WithAssetFilter
          showFilterBar={!isInEditMode}
          isClick={isClick}
          nodeClick={nodeClick}
          headerComp={<Header beforeBack={beforeBack} title={title}/>}
          filterBarRightComp={uiSettingIcon()}
        >
          <Loading visible={isGlobalLoading} />
          {
            !isInEditMode && children
          }
          <div className='iframe-container'>
            <Drawer
              position='bottom'
              className='widgets'
              open={isWidgetListOpen}
              onOpenChange={(open) => {
                setWidgetListOpen(open);
              }}
              sidebar={uiWidgetList()}
            >
              {isInEditMode && uiToolBarElem()}
              <iframe src={url} ref={iframeRef} frameBorder='0' title='dtiv' onLoad={reConfigDtv} />
              {isInEditMode && 
                <div className='btn-group'>
                    <div className='btn-cancel' onClick={()=>setCancleModalVisiable(true)}>{i18n.Dtv.btnTxtCancle}</div>
                    <div className='btn-save'  onClick={actions.toSave}>{i18n.Dtv.btnTxtSave}</div>
                </div>
              }
            </Drawer>
          </div>
        </WithAssetFilter>
        
        <Modal visiable={showCancelConfirmModal}
          btnConfig={cancleConfirmBtnConfig}
        >
          {i18n.Dtv.cancelDialogTip}
        </Modal>
  
        <Modal visiable={showDeleteConfirmModal}
          btnConfig={delConfirmBtnConfig}
        >
          {i18n.Dtv.deleteDialogTip}
        </Modal>
      </div>
    );
  });
  
  DtvHost.defaultProps = {
    prefixCls: 'mc-dtv-host',
  };
  
  export default DtvHost;
  
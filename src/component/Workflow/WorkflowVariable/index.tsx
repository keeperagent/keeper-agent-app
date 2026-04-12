import { useCallback, useEffect, useState } from "react";
import { Popover, FormInstance, Input } from "antd";
import { connect, useSelector } from "react-redux";
import { Node } from "@xyflow/react";
import _ from "lodash";
import { RootState } from "@/redux/store";
import { MagicIcon } from "@/component/Icon";
import {
  ICampaign,
  IWorkflowVariable,
  IWorkflow,
  SETTING_TYPE,
  WorkflowVariableSourceType,
} from "@/electron/type";
import { settingSelector } from "@/redux/setting";
import { getVariableFromCampaign } from "@/component/Workflow/util";
import { getVariablesFromNodes } from "./util";
import { removeSpecialCharacter } from "@/component/Workflow/Panel/util";
import { useTranslation } from "@/hook";
import { useGetListSetting } from "@/hook/setting";
import { ListVariableWrapper, PopoverContentWrapper, Wrapper } from "./style";
import Variable from "./Variable";

type IProps = {
  selectedCampaign: ICampaign | null;
  selectedWorkflow: IWorkflow | null;
  form?: FormInstance;
  fieldName?: string;
  nodes: Node[];
  isAppend?: boolean;
  hideText?: boolean;
  indexOfValue?: number;
  onChange?: (value: string) => void;
  useJavascriptVariable?: boolean;
};

export const getVariableFormat = (variable: any) => {
  return `{{${variable}}}`;
};

const WorkflowVariable = (props: IProps) => {
  const { translate } = useTranslation();
  const {
    selectedCampaign,
    selectedWorkflow,
    form,
    fieldName,
    nodes,
    isAppend,
    hideText,
    indexOfValue,
    onChange,
    useJavascriptVariable,
  } = props;
  const [currentValue, setCurrentValue] = useState("");
  const [searchText, setSearchText] = useState("");
  const { getListSetting } = useGetListSetting();
  const listSetting = useSelector(
    (state: RootState) => settingSelector(state).listSetting,
  );

  useEffect(() => {
    getListSetting({
      page: 1,
      pageSize: 1000,
      type: SETTING_TYPE.WORKFLOW_GLOBAL_VARIABLE,
    });
  }, []);

  useEffect(() => {
    if (fieldName && form) {
      let value = form?.getFieldValue(fieldName);
      if (indexOfValue !== undefined) {
        value = value?.[indexOfValue];
      }
      setCurrentValue(value);
    }
  }, [fieldName, form]);

  const renderListVariable = useCallback(() => {
    const mapVariable: { [key: string]: IWorkflowVariable } = {};

    // global variables — lowest priority
    listSetting
      .filter((item) => item.type === SETTING_TYPE.WORKFLOW_GLOBAL_VARIABLE)
      .forEach((item) => {
        if (item.workflowGlobalVariable?.variable) {
          const { variable, label } = item.workflowGlobalVariable;
          mapVariable[variable] = {
            variable,
            label: label || variable,
            sourceType: WorkflowVariableSourceType.GLOBAL,
          };
        }
      });

    // other-workflow variables — second priority
    selectedCampaign?.listWorkflow?.forEach((otherWorkflow: IWorkflow) => {
      if (otherWorkflow.id === selectedWorkflow?.id) {
        return;
      }

      try {
        const parsedData = JSON.parse(otherWorkflow.data || "{}");
        const otherNodes: Node[] = parsedData.nodes || [];
        const otherVars = getVariablesFromNodes(otherNodes, translate);
        Object.values(otherVars).forEach((variable: IWorkflowVariable) => {
          mapVariable[variable.variable] = {
            ...variable,
            sourceLabel: `${translate("from")} ${otherWorkflow.name}`,
            sourceType: WorkflowVariableSourceType.OTHER_WORKFLOW,
          };
        });
      } catch {}
    });

    // get variable from Campaign — third priority
    if (selectedCampaign) {
      const listVariableOfCampaign = getVariableFromCampaign(
        selectedCampaign,
        translate,
      );
      listVariableOfCampaign?.forEach((variable: IWorkflowVariable) => {
        if (variable?.variable) {
          mapVariable[variable?.variable] = {
            ...variable,
            sourceType: WorkflowVariableSourceType.WORKFLOW,
          };
        }
      });
    }

    // set variable from Workflow variables — fourth priority
    selectedWorkflow?.listVariable?.forEach((variable: IWorkflowVariable) => {
      if (variable?.variable) {
        mapVariable[variable?.variable] = {
          ...variable,
          sourceType: WorkflowVariableSourceType.WORKFLOW,
        };
      }
    });

    // get variable from current nodes — highest priority
    const currentNodeVars = getVariablesFromNodes(
      nodes,
      translate,
      selectedCampaign,
    );
    Object.entries(currentNodeVars).forEach(([key, variable]) => {
      mapVariable[key] = {
        ...variable,
        sourceType: WorkflowVariableSourceType.WORKFLOW,
      };
    });

    let listVariable = Object.values(mapVariable);
    listVariable = _.sortBy(
      listVariable,
      (variable: IWorkflowVariable) => variable?.variable,
    );

    const totalCount = listVariable.length;

    if (searchText) {
      const regex = new RegExp(
        removeSpecialCharacter(searchText.toLowerCase()),
        "i",
      );
      listVariable = listVariable.filter(
        (variable: IWorkflowVariable) =>
          regex.test(variable?.variable?.toLowerCase()) ||
          regex.test(variable?.label?.toLowerCase() || "") ||
          regex.test(variable?.sourceLabel?.toLowerCase() || ""),
      );
    }

    return (
      <PopoverContentWrapper>
        {totalCount > 10 && (
          <div className="search">
            <Input
              className="custom-input"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder={translate("button.search")}
              allowClear
            />
          </div>
        )}

        <ListVariableWrapper>
          {listVariable?.map((variable: IWorkflowVariable, index: number) => (
            <Variable
              variable={variable}
              key={index}
              onClick={() => onSelectVariable(variable?.variable)}
              isActive={currentValue === getVariableFormat(variable?.variable)}
              useJavascriptVariable={useJavascriptVariable}
            />
          ))}
        </ListVariableWrapper>
      </PopoverContentWrapper>
    );
  }, [
    selectedCampaign,
    selectedWorkflow,
    nodes,
    translate,
    currentValue,
    listSetting,
    searchText,
  ]);

  const onSelectVariable = (variable: any) => {
    let value = getVariableFormat(variable);
    if (fieldName && form) {
      const preValue = form?.getFieldValue(fieldName);
      if (isAppend && preValue) {
        value = `${preValue} ${value}`;
      }

      if (indexOfValue !== undefined) {
        const newValues = preValue ? [...preValue] : [];
        newValues[indexOfValue] = value;
        form.setFieldValue(fieldName, newValues);
      } else {
        form.setFieldValue(fieldName, value);
      }
    }

    setCurrentValue(value);
    onChange && onChange(value);
  };

  return (
    <Popover content={renderListVariable()} placement="right">
      <Wrapper>
        <div className="button">
          {!hideText && (
            <div className="text">{translate("select.variable")}</div>
          )}
          <div className="icon">
            <MagicIcon />
          </div>
        </div>
      </Wrapper>
    </Popover>
  );
};

export default connect(
  (state: RootState) => ({
    selectedCampaign: state?.Campaign?.selectedCampaign,
    selectedWorkflow: state?.Workflow?.selectedWorkflow,
    nodes: state?.WorkflowRunner?.flowData?.present?.nodes,
  }),
  {},
)(WorkflowVariable);

import { useCallback, useEffect, useState } from "react";
import { Popover, FormInstance } from "antd";
import { connect } from "react-redux";
import { Node } from "@xyflow/react";
import _ from "lodash";
import { RootState } from "@/redux/store";
import { MagicIcon } from "@/component/Icon";
import {
  IApproveRevokeEVMNodeConfig,
  ICalculateNodeConfig,
  ICampaign,
  ICheckElementExistNodeConfig,
  IConvertTokenAmountNodeConfig,
  ICrawlTextNodeConfig,
  IEVMReadFromContractNodeConfig,
  IEVMSnipeContractNodeConfig,
  IEVMWriteContractNodeConfig,
  IExecuteCodeNodeConfig,
  IExecuteTransactionNodeConfig,
  IGenerateProfileNodeConfig,
  IGetGasPriceNodeConfig,
  IGetRandomValueNodeConfig,
  IGetTokenPriceNodeConfig,
  IGetWalletBalanceNodeConfig,
  IWorkflowVariable,
  ISetAttributeNodeConfig,
  ISwapCetusNodeConfig,
  ISwapUniswapNodeConfig,
  ITransferTokenNodeConfig,
  IGenerateVanityAddressNodeConfig,
  ILaunchTokenBonkfunNodeConfig,
  IWorkflow,
} from "@/electron/type";
import { getVariableFromCampaign } from "@/component/Workflow/util";
import { useTranslation } from "@/hook";
import {
  WORKFLOW_TYPE,
  SNIPE_CONTRACT_BLOCK_NUMBER,
  SNIPE_CONTRACT_TX_HASH,
  SNIPE_CONTRACT_LOG_INDEX,
  SNIPE_CONTRACT_CONTRACT_ADDRESS,
  IS_WALLET_EXIST,
  WALLET_VARIABLE,
  IS_RESOURCE_EXIST,
} from "@/electron/constant";
import { SCRIPT_NAME_EN } from "@/config/constant";
import { ListVariableWrapper, Wrapper } from "./style";
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

  useEffect(() => {
    if (fieldName && form) {
      let value = form?.getFieldValue(fieldName);
      if (indexOfValue !== undefined) {
        value = value?.[indexOfValue];
      }
      setCurrentValue(value);
    }
  }, [fieldName, form]);

  const SCRIPT_NAME = SCRIPT_NAME_EN;

  const renderListVariable = useCallback(() => {
    const mapVariable: { [key: string]: IWorkflowVariable; } = {};

    if (selectedCampaign) {
      const listVariableOfCampaign = getVariableFromCampaign(
        selectedCampaign,
        translate,
      );
      listVariableOfCampaign?.forEach((variable: IWorkflowVariable) => {
        if (variable?.variable) {
          mapVariable[variable?.variable] = variable;
        }
      });
    }

    // set variable from config of Workflow
    selectedWorkflow?.listVariable?.forEach((variable: IWorkflowVariable) => {
      if (variable?.variable) {
        mapVariable[variable?.variable] = variable;
      }
    });

    // get variable from Node
    nodes?.forEach((node: Node) => {
      switch ((node?.data?.config as any)?.workflowType) {
        case WORKFLOW_TYPE.GENERATE_PROFILE: {
          if (selectedCampaign) {
            return;
          }

          const listProfile =
            (node?.data?.config as IGenerateProfileNodeConfig)?.listProfile ||
            [];

          const listVariableOfNode: IWorkflowVariable[] = [];
          listProfile?.forEach((profile: IWorkflowVariable[]) => {
            listVariableOfNode.push(...profile);
          });
          listVariableOfNode?.forEach((variable: IWorkflowVariable) => {
            if (variable?.variable) {
              mapVariable[variable?.variable] = variable;
            }
          });
          return;
        }

        case WORKFLOW_TYPE.SET_ATTRIBUTE: {
          const config = node?.data?.config as ISetAttributeNodeConfig;
          const variable: IWorkflowVariable = {
            variable: config?.variable || "",
            label: `${translate("from")} ${SCRIPT_NAME[WORKFLOW_TYPE.SET_ATTRIBUTE]
              } Processor`,
          };

          if (variable?.variable) {
            mapVariable[variable?.variable] = variable;
          }
          return;
        }

        case WORKFLOW_TYPE.CRAWL_TEXT: {
          const config = node?.data?.config as ICrawlTextNodeConfig;
          const variable: IWorkflowVariable = {
            variable: config?.variable || "",
            label: `${translate("from")} ${SCRIPT_NAME[WORKFLOW_TYPE.CRAWL_TEXT]
              } Processor`,
          };

          if (variable?.variable) {
            mapVariable[variable?.variable] = variable;
          }
          return;
        }

        case WORKFLOW_TYPE.GET_RANDOM_VALUE: {
          const config = node?.data?.config as IGetRandomValueNodeConfig;
          const variable: IWorkflowVariable = {
            variable: config?.variable || "",
            label: `${translate("from")} ${SCRIPT_NAME[WORKFLOW_TYPE.GET_RANDOM_VALUE]
              } Processor`,
          };

          if (variable?.variable) {
            mapVariable[variable?.variable] = variable;
          }
          return;
        }

        case WORKFLOW_TYPE.CHECK_ELEMENT_EXIST: {
          const config = node?.data?.config as ICheckElementExistNodeConfig;
          const variable: IWorkflowVariable = {
            variable: config?.variable || "",
            label: `${translate("from")} ${SCRIPT_NAME[WORKFLOW_TYPE.CHECK_ELEMENT_EXIST]
              } Processor`,
          };

          if (variable?.variable) {
            mapVariable[variable?.variable] = variable;
          }
          return;
        }

        case WORKFLOW_TYPE.GET_GAS_PRICE: {
          const config = node?.data?.config as IGetGasPriceNodeConfig;
          const variable: IWorkflowVariable = {
            variable: config?.variable || "",
            label: `${translate("from")} ${SCRIPT_NAME[WORKFLOW_TYPE.GET_GAS_PRICE]
              } Processor`,
          };

          if (variable?.variable) {
            mapVariable[variable?.variable] = variable;
          }
          return;
        }

        case WORKFLOW_TYPE.GET_WALLET_BALANCE: {
          const config = node?.data?.config as IGetWalletBalanceNodeConfig;
          const variable: IWorkflowVariable = {
            variable: config?.variable || "",
            label: `${translate("from")} ${SCRIPT_NAME[WORKFLOW_TYPE.GET_WALLET_BALANCE]
              } Processor`,
          };

          if (variable?.variable) {
            mapVariable[variable?.variable] = variable;
          }
          return;
        }

        case WORKFLOW_TYPE.CALCULATE: {
          const config = node?.data?.config as ICalculateNodeConfig;
          const variable: IWorkflowVariable = {
            variable: config?.variable || "",
            label: `${translate("from")} ${SCRIPT_NAME[WORKFLOW_TYPE.CALCULATE]
              } Processor`,
          };

          if (variable?.variable) {
            mapVariable[variable?.variable] = variable;
          }
          return;
        }

        case WORKFLOW_TYPE.TRANSFER_TOKEN: {
          const config = node?.data?.config as ITransferTokenNodeConfig;
          const variable: IWorkflowVariable = {
            variable: config?.variable || "",
            label: `${translate("from")} ${SCRIPT_NAME[WORKFLOW_TYPE.TRANSFER_TOKEN]
              } Processor`,
          };

          if (variable?.variable) {
            mapVariable[variable?.variable] = variable;
          }
          return;
        }

        case WORKFLOW_TYPE.EVM_APPROVE_REVOKE_TOKEN: {
          const config = node?.data?.config as IApproveRevokeEVMNodeConfig;
          const variable: IWorkflowVariable = {
            variable: config?.variable || "",
            label: `${translate("from")} ${SCRIPT_NAME[WORKFLOW_TYPE.EVM_APPROVE_REVOKE_TOKEN]
              } Processor`,
          };

          if (variable?.variable) {
            mapVariable[variable?.variable] = variable;
          }
          return;
        }

        case WORKFLOW_TYPE.SWAP_UNISWAP: {
          const config = node?.data?.config as ISwapUniswapNodeConfig;
          const variable: IWorkflowVariable = {
            variable: config?.variable || "",
            label: `${translate("from")} ${SCRIPT_NAME[WORKFLOW_TYPE.SWAP_UNISWAP]
              } Processor`,
          };

          if (variable?.variable) {
            mapVariable[variable?.variable] = variable;
          }
          return;
        }

        case WORKFLOW_TYPE.SWAP_PANCAKESWAP: {
          const config = node?.data?.config as ISwapUniswapNodeConfig;
          const variable: IWorkflowVariable = {
            variable: config?.variable || "",
            label: `${translate("from")} ${SCRIPT_NAME[WORKFLOW_TYPE.SWAP_UNISWAP]
              } Processor`,
          };

          if (variable?.variable) {
            mapVariable[variable?.variable] = variable;
          }
          return;
        }

        case WORKFLOW_TYPE.SWAP_CETUS: {
          const config = node?.data?.config as ISwapCetusNodeConfig;
          const variable: IWorkflowVariable = {
            variable: config?.variable || "",
            label: `${translate("from")} ${SCRIPT_NAME[WORKFLOW_TYPE.SWAP_UNISWAP]
              } Processor`,
          };

          if (variable?.variable) {
            mapVariable[variable?.variable] = variable;
          }
          return;
        }

        case WORKFLOW_TYPE.EVM_SNIPE_CONTRACT: {
          const config = node?.data?.config as IEVMSnipeContractNodeConfig;
          let listVariable = config?.input?.listVariable || [];
          listVariable = [
            ...listVariable,
            SNIPE_CONTRACT_BLOCK_NUMBER,
            SNIPE_CONTRACT_TX_HASH,
            SNIPE_CONTRACT_LOG_INDEX,
            SNIPE_CONTRACT_CONTRACT_ADDRESS,
          ];
          listVariable?.forEach((variableName) => {
            const variable: IWorkflowVariable = {
              variable: variableName,
              label: `${translate("from")} ${SCRIPT_NAME[WORKFLOW_TYPE.EVM_SNIPE_CONTRACT]
                } Processor`,
            };

            if (variable?.variable) {
              mapVariable[variable?.variable] = variable;
            }
          });

          return;
        }

        case WORKFLOW_TYPE.EVM_WRITE_TO_CONTRACT: {
          const config = node?.data?.config as IEVMWriteContractNodeConfig;
          const variable: IWorkflowVariable = {
            variable: config?.variable || "",
            label: `${translate("from")} ${SCRIPT_NAME[WORKFLOW_TYPE.EVM_WRITE_TO_CONTRACT]
              } Processor`,
          };

          if (variable?.variable) {
            mapVariable[variable?.variable] = variable;
          }
          return;
        }

        case WORKFLOW_TYPE.EVM_READ_FROM_CONTRACT: {
          const config = node?.data?.config as IEVMReadFromContractNodeConfig;
          const listVariable = config?.listVariable || [];
          listVariable?.forEach((variableName) => {
            const variable: IWorkflowVariable = {
              variable: variableName,
              label: `${translate("from")} ${SCRIPT_NAME[WORKFLOW_TYPE.EVM_READ_FROM_CONTRACT]
                } Processor`,
            };

            if (variable?.variable) {
              mapVariable[variable?.variable] = variable;
            }
          });

          return;
        }

        case WORKFLOW_TYPE.EXECUTE_TRANSACTION: {
          const config = node?.data?.config as IExecuteTransactionNodeConfig;
          const variable: IWorkflowVariable = {
            variable: config?.variable || "",
            label: `${translate("from")} ${SCRIPT_NAME[WORKFLOW_TYPE.EXECUTE_TRANSACTION]
              } Processor`,
          };

          if (variable?.variable) {
            mapVariable[variable?.variable] = variable;
          }

          return;
        }

        case WORKFLOW_TYPE.CONVERT_TOKEN_AMOUNT: {
          const config = node?.data?.config as IConvertTokenAmountNodeConfig;
          const variable: IWorkflowVariable = {
            variable: config?.variable || "",
            label: `${translate("from")} ${SCRIPT_NAME[WORKFLOW_TYPE.CONVERT_TOKEN_AMOUNT]
              } Processor`,
          };

          if (variable?.variable) {
            mapVariable[variable?.variable] = variable;
          }
          return;
        }

        case WORKFLOW_TYPE.GET_TOKEN_PRICE: {
          const config = node?.data?.config as IGetTokenPriceNodeConfig;
          const variable: IWorkflowVariable = {
            variable: config?.variable || "",
            label: `${translate("from")} ${SCRIPT_NAME[WORKFLOW_TYPE.GET_TOKEN_PRICE]
              } Processor`,
          };

          if (variable?.variable) {
            mapVariable[variable?.variable] = variable;
          }
          return;
        }

        case WORKFLOW_TYPE.EXECUTE_CODE: {
          const config = node?.data?.config as IExecuteCodeNodeConfig;
          const variable: IWorkflowVariable = {
            variable: config?.variable || "",
            label: `${translate("from")} ${SCRIPT_NAME[WORKFLOW_TYPE.EXECUTE_CODE]
              } Processor`,
          };

          if (variable?.variable) {
            mapVariable[variable?.variable] = variable;
          }
          return;
        }

        case WORKFLOW_TYPE.SELECT_WALLET: {
          const listVariable = [
            IS_WALLET_EXIST,
            WALLET_VARIABLE.WALLET_ADDRESS,
            WALLET_VARIABLE.WALLET_PHRASE,
            WALLET_VARIABLE.WALLET_PRIVATE_KEY,
          ];
          listVariable?.forEach((variableName) => {
            const variable: IWorkflowVariable = {
              variable: variableName,
              label: `${translate("from")} ${SCRIPT_NAME[WORKFLOW_TYPE.EVM_SNIPE_CONTRACT]
                } Processor`,
            };

            if (variable?.variable) {
              mapVariable[variable?.variable] = variable;
            }
          });

          return;
        }

        case WORKFLOW_TYPE.CHECK_RESOURCE: {
          const variable: IWorkflowVariable = {
            variable: IS_RESOURCE_EXIST,
            label: `${translate("from")} ${SCRIPT_NAME[WORKFLOW_TYPE.CHECK_RESOURCE]
              } Processor`,
          };

          if (variable?.variable) {
            mapVariable[variable?.variable] = variable;
          }
          return;
        }

        case WORKFLOW_TYPE.GENERATE_VANITY_ADDRESS: {
          const config = node?.data?.config as IGenerateVanityAddressNodeConfig;
          const addressVariable: IWorkflowVariable = {
            variable: config?.variableToSaveAddress || "",
            label: `${translate("from")} ${SCRIPT_NAME[WORKFLOW_TYPE.GENERATE_VANITY_ADDRESS]
              } Processor`,
          };

          if (addressVariable?.variable) {
            mapVariable[addressVariable?.variable] = addressVariable;
          }

          const privateKeyVariable: IWorkflowVariable = {
            variable: config?.variableToSavePrivateKey || "",
            label: `${translate("from")} ${SCRIPT_NAME[WORKFLOW_TYPE.GENERATE_VANITY_ADDRESS]
              } Processor`,
          };

          if (privateKeyVariable?.variable) {
            mapVariable[privateKeyVariable?.variable] = privateKeyVariable;
          }
          return;
        }

        case WORKFLOW_TYPE.LAUNCH_TOKEN_PUMPFUN: {
          const config = node?.data?.config as ILaunchTokenBonkfunNodeConfig;
          const addressVariable: IWorkflowVariable = {
            variable: config?.variableTokenAddress || "",
            label: `${translate("from")} ${SCRIPT_NAME[WORKFLOW_TYPE.LAUNCH_TOKEN_PUMPFUN]
              } Processor`,
          };

          if (addressVariable?.variable) {
            mapVariable[addressVariable?.variable] = addressVariable;
          }

          const txHashVariable: IWorkflowVariable = {
            variable: config?.variableTxHash || "",
            label: `${translate("from")} ${SCRIPT_NAME[WORKFLOW_TYPE.LAUNCH_TOKEN_PUMPFUN]
              } Processor`,
          };

          if (txHashVariable?.variable) {
            mapVariable[txHashVariable?.variable] = txHashVariable;
          }
          return;
        }

        case WORKFLOW_TYPE.LAUNCH_TOKEN_BONKFUN: {
          const config = node?.data?.config as ILaunchTokenBonkfunNodeConfig;
          const addressVariable: IWorkflowVariable = {
            variable: config?.variableTokenAddress || "",
            label: `${translate("from")} ${SCRIPT_NAME[WORKFLOW_TYPE.LAUNCH_TOKEN_BONKFUN]
              } Processor`,
          };

          if (addressVariable?.variable) {
            mapVariable[addressVariable?.variable] = addressVariable;
          }

          const txHashVariable: IWorkflowVariable = {
            variable: config?.variableTxHash || "",
            label: `${translate("from")} ${SCRIPT_NAME[WORKFLOW_TYPE.LAUNCH_TOKEN_BONKFUN]
              } Processor`,
          };

          if (txHashVariable?.variable) {
            mapVariable[txHashVariable?.variable] = txHashVariable;
          }
          return;
        }
      }
    });



    let listVariable = Object.values(mapVariable);
    listVariable = _.sortBy(
      listVariable,
      (variable: IWorkflowVariable) => variable?.variable,
    );

    return (
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
    );
  }, [selectedCampaign, nodes, translate, currentValue]);

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

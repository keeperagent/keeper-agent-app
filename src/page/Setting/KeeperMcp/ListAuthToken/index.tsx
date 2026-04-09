import { Fragment, useEffect, useState } from "react";
import { Button, Empty, Form, Popconfirm, Spin } from "antd";
import { IMcpToken, McpTokenPermission } from "@/electron/type";
import { useTranslation } from "@/hook";
import {
  useGetListMcpToken,
  useCreateMcpToken,
  useDeleteMcpToken,
} from "@/hook/mcpToken";
import { ListConnectedAgent } from "../ListConnectedAgent";
import { ModalMcpToken } from "./ModalMcpToken";
import ModalTokenPreview from "./ModalTokenPreview";
import { ListAuthTokenRoot } from "./style";

export const ListAuthToken = () => {
  const { translate } = useTranslation();
  const {
    tokens,
    connections,
    loading: loadingTokens,
    getListMcpToken,
  } = useGetListMcpToken();
  const {
    createMcpToken,
    clearCreatedToken,
    loading: creatingToken,
    isSuccess: createSuccess,
    createdToken,
  } = useCreateMcpToken();
  const {
    deleteMcpToken,
    loading: deletingToken,
    isSuccess: deleteSuccess,
  } = useDeleteMcpToken();

  const [isModalOpen, setModalOpen] = useState(false);
  const [deleteConfirmForId, setDeleteConfirmForId] = useState<number | null>(
    null,
  );
  const [form] = Form.useForm();

  useEffect(() => {
    getListMcpToken();
  }, []);

  useEffect(() => {
    if (!creatingToken && createSuccess) {
      setModalOpen(false);
      form.resetFields();
      getListMcpToken();
    }
  }, [creatingToken, createSuccess, form, getListMcpToken]);

  useEffect(() => {
    if (!deletingToken && deleteSuccess) {
      getListMcpToken();
    }
  }, [deletingToken, deleteSuccess, getListMcpToken]);

  const onOpenModal = () => {
    form.resetFields();
    setModalOpen(true);
  };

  const onCreateToken = async () => {
    try {
      const values = await form.validateFields();
      const plainToken =
        crypto.randomUUID().replace(/-/g, "") +
        crypto.randomUUID().replace(/-/g, "");

      createMcpToken({
        name: values.name,
        permission: values.permission,
        plainToken,
      });
    } catch {}
  };

  const onDeleteToken = (tokenId: number) => {
    deleteMcpToken([tokenId]);
  };

  return (
    <Fragment>
      <ListAuthTokenRoot>
        <div className="section-wrapper">
          <div className="section-header">
            <div className="section-title">{translate("mcp.authTokens")}</div>

            <Button type="primary" onClick={onOpenModal} size="small">
              {translate("mcp.createToken")}
            </Button>
          </div>

          {loadingTokens ? (
            <div className="loading-center">
              <Spin />
            </div>
          ) : tokens.length === 0 ? (
            <div className="empty">
              <Empty description={translate("mcp.noTokens")} />
            </div>
          ) : (
            <div className="token-list">
              {tokens.map((token: IMcpToken) => (
                <div
                  className={
                    deleteConfirmForId === token.id
                      ? "token-row token-row--confirm-open"
                      : "token-row"
                  }
                  key={token.id}
                >
                  <div className="token-info">
                    <div className="token-name">{token.name}</div>
                    <div className="token-permission">
                      {token.permission === McpTokenPermission.READ_WRITE
                        ? translate("mcp.permissionReadWrite")
                        : translate("mcp.permissionRead")}
                    </div>
                  </div>

                  <div className="delete-button-wrapper">
                    <Popconfirm
                      open={deleteConfirmForId === token.id}
                      onOpenChange={(nextOpen) =>
                        setDeleteConfirmForId(nextOpen ? token.id! : null)
                      }
                      title={
                        <span
                          style={{
                            width: "35rem",
                            display: "block",
                          }}
                        >
                          {translate("mcp.deleteTokenConfirm")}
                        </span>
                      }
                      onConfirm={() => onDeleteToken(token.id!)}
                      okText={translate("yes")}
                      cancelText={translate("no")}
                      style={{ width: "10rem" }}
                    >
                      <Button
                        type="primary"
                        size="small"
                        loading={deletingToken}
                        danger
                      >
                        {translate("button.delete")}
                      </Button>
                    </Popconfirm>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ListAuthTokenRoot>

      <ModalMcpToken
        open={isModalOpen}
        loading={creatingToken}
        form={form}
        onOk={onCreateToken}
        onCancel={() => setModalOpen(false)}
      />

      <ModalTokenPreview
        plainToken={createdToken?.plainToken ?? null}
        onClose={clearCreatedToken}
      />

      <ListConnectedAgent connections={connections} />
    </Fragment>
  );
};

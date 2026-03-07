import { useEffect, useMemo, useRef, useState } from "react";
import { connect } from "react-redux";
import { Button, Pagination, Select, Spin } from "antd";
import { SearchInput } from "@/component/Input";
import { PlusIcon } from "@/component/Icon";
import { PrimaryButton } from "@/component/Button";
import {
  useGetListAgentSkill,
  useDeleteAgentSkill,
  useUpdateAgentSkill,
} from "@/hook/agentSkill";
import {
  actSetSortFieldAgentSkill,
  actSetModalOpenAgentSkill,
  actSaveSelectedAgentSkill,
} from "@/redux/agentSkill";
import { RootState } from "@/redux/store";
import { IAgentSkill } from "@/electron/type";
import { SORT_ORDER } from "@/electron/constant";
import { useTranslation } from "@/hook/useTranslation";
import ModalAgentSkill from "./ModalAgentSkill";
import AgentSkillItem from "./AgentSkillItem";
import { Wrapper } from "./style";

const PAGE_SIZE = 9;

const SkillsManager = (props: any) => {
  const { listAgentSkill, sortField, page, totalData } = props;
  const { loading, getListAgentSkill } = useGetListAgentSkill();
  const { deleteAgentSkill } = useDeleteAgentSkill();
  const { updateAgentSkill } = useUpdateAgentSkill();
  const { translate } = useTranslation();
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [searchText, setSearchText] = useState("");

  const listSortField = useMemo(
    () => [
      { label: translate("name"), value: "name" },
      { label: translate("description"), value: "description" },
      { label: translate("agent.activeStatus"), value: "isEnabled" },
      { label: translate("createdAt"), value: "createAt" },
      { label: translate("updatedAt"), value: "updateAt" },
    ],
    [translate],
  );
  const listSortOrder = useMemo(
    () => [
      { label: translate("ascending"), value: SORT_ORDER.ASC },
      { label: translate("descending"), value: SORT_ORDER.DESC },
    ],
    [translate],
  );

  const fetchList = (currentPage: number = 1) => {
    getListAgentSkill({
      page: currentPage,
      pageSize: PAGE_SIZE,
      searchText: searchText || undefined,
      sortField: sortField,
    });
  };

  useEffect(() => {
    fetchList(1);
  }, [sortField]);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchTimeoutRef.current = null;
      getListAgentSkill({
        page: 1,
        pageSize: PAGE_SIZE,
        searchText,
        sortField,
      });
    }, 200);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchText]);

  const onPageChange = (newPage: number) => {
    fetchList(newPage);
  };

  const onChangeSortField = (value: string) => {
    props?.actSetSortFieldAgentSkill({ field: value });
  };
  const onChangeSortOrder = (value: string) => {
    props?.actSetSortFieldAgentSkill({ order: value });
  };

  const handleAdd = () => {
    props?.actSaveSelectedAgentSkill(null);
    props?.actSetModalOpenAgentSkill(true);
  };

  const handleEdit = (item: IAgentSkill) => {
    props?.actSaveSelectedAgentSkill(item);
    props?.actSetModalOpenAgentSkill(true);
  };

  const handleDelete = (id: number) => {
    deleteAgentSkill(id);
  };

  const handleToggle = (item: IAgentSkill) => {
    updateAgentSkill({ ...item, isEnabled: !item.isEnabled });
  };

  return (
    <Wrapper>
      <div className="header">
        <div className="actions">
          <SearchInput
            placeholder={translate("button.search")}
            value={searchText}
            onChange={setSearchText}
            style={{ width: "30rem" }}
          />

          <Select
            className="custom-select"
            placeholder={translate("sortBy")}
            allowClear
            size="large"
            options={listSortField}
            style={{ width: "15rem" }}
            value={sortField?.field || null}
            onChange={onChangeSortField}
            loading={loading}
          />

          <Select
            className="custom-select"
            placeholder={translate("sortOrder")}
            allowClear
            size="large"
            options={listSortOrder}
            style={{ width: "15rem" }}
            value={sortField?.order || null}
            onChange={onChangeSortOrder}
            loading={loading}
          />

          <Button type="primary" onClick={handleAdd} className="btn-add">
            {translate("agent.addSkill")}
          </Button>
        </div>
      </div>

      {!loading && listAgentSkill?.length === 0 && (
        <div className="empty-state">
          <div className="empty-title">{translate("agent.noSkill")}</div>

          <div className="empty-description">
            {translate("agent.addSkillDescription")}
          </div>

          <span>
            <PrimaryButton
              icon={<PlusIcon />}
              onClick={handleAdd}
              text={translate("agent.addSkill")}
            />
          </span>
        </div>
      )}

      <Spin size="default" spinning={loading} style={{ minHeight: "70vh" }}>
        <div className="list-item">
          {listAgentSkill?.map((item: IAgentSkill) => (
            <AgentSkillItem
              key={item.id}
              item={item}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggle={handleToggle}
            />
          ))}
        </div>

        {totalData > PAGE_SIZE && (
          <div className="pagination-wrap">
            <Pagination
              current={page}
              pageSize={PAGE_SIZE}
              total={totalData}
              showSizeChanger={false}
              onChange={onPageChange}
            />
          </div>
        )}
      </Spin>

      <ModalAgentSkill />
    </Wrapper>
  );
};

export default connect(
  (state: RootState) => ({
    listAgentSkill: state?.AgentSkill?.listAgentSkill,
    sortField: state?.AgentSkill?.sortField,
    page: state?.AgentSkill?.page,
    totalData: state?.AgentSkill?.totalData,
  }),
  {
    actSetSortFieldAgentSkill,
    actSetModalOpenAgentSkill,
    actSaveSelectedAgentSkill,
  },
)(SkillsManager);

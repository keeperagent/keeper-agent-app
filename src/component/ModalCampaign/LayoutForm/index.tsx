import { Fragment, useEffect, useRef } from "react";
import { Form, InputNumber } from "antd";
import { TagOption } from "@/component";
import { useTranslation, useGetScreenSize } from "@/hook";
import { Wrapper } from "./style";

type IProps = {
  setFullScreen: (payload: boolean) => void;
  isFullScreen: boolean;
};

const LayoutForm = (props: IProps) => {
  const { setFullScreen, isFullScreen } = props;
  const { translate } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  const { getScreenSize } = useGetScreenSize();

  useEffect(() => {
    setTimeout(() => {
      inputRef?.current?.focus();
    }, 100);

    getScreenSize();
  }, []);

  return (
    <Wrapper>
      <div className="mode">
        <TagOption
          content={translate("campaign.fullScreen")}
          checked={isFullScreen}
          onClick={() => setFullScreen(true)}
          style={{ fontSize: "1.1rem" }}
        />

        <TagOption
          content={translate("campaign.customScreenSize")}
          checked={!isFullScreen}
          onClick={() => setFullScreen(false)}
          style={{ fontSize: "1.1rem" }}
        />
      </div>

      {!isFullScreen && (
        <Fragment>
          <Form.Item
            label={`${translate("campaign.windowWidth")}`}
            name="windowWidth"
            rules={[
              {
                required: true,
                message: translate("form.requiredField"),
              },
            ]}
          >
            <InputNumber
              placeholder={translate("campaign.windowWidthPlaceholder")}
              className="custom-input"
              size="large"
              // @ts-ignore
              ref={inputRef}
              style={{ width: "100%" }}
              min={1}
            />
          </Form.Item>

          <Form.Item
            label={`${translate("campaign.windowHeight")}:`}
            name="windowHeight"
            rules={[
              {
                required: true,
                message: translate("form.requiredField"),
              },
            ]}
            style={{ width: "100%" }}
          >
            <InputNumber
              placeholder={translate("campaign.windowHeightPlaceholder")}
              className="custom-input"
              size="large"
              style={{ width: "100%" }}
              min={1}
            />
          </Form.Item>
        </Fragment>
      )}
    </Wrapper>
  );
};

export default LayoutForm;

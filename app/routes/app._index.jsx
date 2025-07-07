import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  Box,
  List,
  Link,
  InlineStack,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";

export default function Index() {
  return (
    <>
      <TitleBar title="Wishlist Dashboard" primaryAction={null} />

      <Page fullWidth>
        <Layout>
          <Layout.Section>
            <Card sectioned>
              <BlockStack gap="400">
                <Text variant="headingLg" as="h2">
                  Welcome to your Wishlist App 🎁
                </Text>
                <Text as="p" tone="subdued">
                  Empower your customers to save and manage their favorite
                  products directly from your store. Our app allows logged-in
                  users to maintain wishlists, making it easier for them to
                  return and purchase later.
                </Text>

                <List>
                  <List.Item>
                    Create personalized wishlists for logged-in customers
                  </List.Item>
                  <List.Item>
                    View wishlist analytics and product trends
                  </List.Item>
                  <List.Item>
                    Encourage repeat purchases with wishlist reminders
                  </List.Item>
                </List>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    </>
  );
}

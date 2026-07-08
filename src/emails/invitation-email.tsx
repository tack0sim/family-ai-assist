import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "react-email";

interface InvitationEmailProps {
  expiresAt: Date;
  familyName: string;
  invitationLink: string;
  invitedByName?: string;
}

export const InvitationEmail = ({
  familyName,
  invitedByName = "A family member",
  invitationLink,
  expiresAt,
}: InvitationEmailProps) => {
  const formattedDate = expiresAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Html>
      <Head />
      <Preview>You're invited to join {familyName} on Family AI</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <Text style={heading}>You're invited!</Text>
            <Hr style={hr} />

            <Text style={paragraph}>
              {invitedByName} has invited you to join the{" "}
              <strong>{familyName}</strong> family on Family AI.
            </Text>

            <Text style={paragraph}>
              Family AI helps families stay connected, manage schedules, and
              collaborate on important tasks.
            </Text>

            <Section style={buttonContainer}>
              <Button href={invitationLink} style={button}>
                Accept Invitation
              </Button>
            </Section>

            <Text style={paragraph}>
              Or copy and paste this link in your browser:{" "}
              <a href={invitationLink} style={link}>
                {invitationLink}
              </a>
            </Text>

            <Hr style={hr} />

            <Text style={footer}>
              This invitation expires on <strong>{formattedDate}</strong>.
            </Text>

            <Text style={footer}>
              If you didn't expect this invitation, you can safely ignore this
              email.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

InvitationEmail.PreviewProps = {
  familyName: "The Johnsons",
  invitedByName: "Sarah Johnson",
  invitationLink: "https://family-ai.app/invite/abc123def456",
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
} as InvitationEmailProps;

const main = {
  backgroundColor: "#f4f4f4",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
};

const box = {
  padding: "0 48px",
};

const heading = {
  fontSize: "32px",
  fontWeight: "700",
  margin: "16px 0",
  padding: "0",
};

const paragraph = {
  color: "#525252",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "16px 0",
};

const buttonContainer = {
  textAlign: "center" as const,
  padding: "32px 0",
};

const button = {
  backgroundColor: "#3b82f6",
  borderRadius: "4px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "12px 32px",
  marginLeft: "auto",
  marginRight: "auto",
};

const link = {
  color: "#3b82f6",
  textDecoration: "underline",
  wordBreak: "break-all" as const,
};

const hr = {
  borderColor: "#e5e5e5",
  margin: "20px 0",
};

const footer = {
  color: "#8b8b8b",
  fontSize: "14px",
  lineHeight: "24px",
  margin: "8px 0",
};

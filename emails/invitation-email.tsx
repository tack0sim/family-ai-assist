import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  pixelBasedPreset,
  Section,
  Tailwind,
  Text,
} from "react-email";

interface InvitationEmailProps {
  expiresAt: Date;
  familyName: string;
  invitationLink: string;
  invitedByName?: string;
}

export default function InvitationEmail({
  familyName,
  invitedByName = "A family member",
  invitationLink,
  expiresAt,
}: InvitationEmailProps) {
  const formattedDate = expiresAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Tailwind
      config={{
        presets: [pixelBasedPreset],
      }}
    >
      <Html>
        <Head />
        <Preview>You're invited to join {familyName} on Family AI</Preview>
        <Body className="bg-gray-100 font-sans">
          <Container className="mx-auto my-16 rounded-lg bg-white p-0 pb-12">
            <Section className="px-12">
              <Text className="mx-0 my-2 p-0 font-bold text-3xl">
                You're invited!
              </Text>
              <Hr className="my-4 border border-[#e5e5e5]" />

              <Text className="my-4 text-base">
                {invitedByName} has invited you to join the{" "}
                <strong>{familyName}</strong> family on Family AI.
              </Text>

              <Text className="my-4 text-base">
                Family AI helps families stay connected, manage schedules, and
                collaborate on important tasks.
              </Text>

              <Section className="my-8 text-center">
                <Button
                  className="rounded-sm bg-[#3b82f6] px-8 py-3 font-bold text-base text-white no-underline"
                  href={invitationLink}
                >
                  Accept Invitation
                </Button>
              </Section>

              <Text className="my-4 text-base">
                Or copy and paste this link in your browser:{" "}
                <a className="text-blue-500 underline" href={invitationLink}>
                  {invitationLink}
                </a>
              </Text>

              <Hr className="my-4 border border-[#e5e5e5]" />

              <Text className="my-2 text-gray-500 text-sm">
                This invitation expires on <strong>{formattedDate}</strong>.
              </Text>

              <Text className="my-2 text-gray-500 text-sm">
                If you didn't expect this invitation, you can safely ignore this
                email.
              </Text>
            </Section>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  );
}

InvitationEmail.PreviewProps = {
  familyName: "The Johnsons",
  invitedByName: "Sarah Johnson",
  invitationLink: "https://family-ai.app/invite/abc123def456",
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
} as InvitationEmailProps;

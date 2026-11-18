import { SiteLayout } from "@/components/site-layout";

const SECTIONS = [
  {
    title: "Information we collect",
    body: "When you sign in with Google we receive your name, email address, and profile picture to create your account. As you use StudyAssistant we store the content you create — sessions, messages, uploaded documents, quizzes, flashcards, and bookmarks — so you can return to it later.",
  },
  {
    title: "How we use your information",
    body: "We use your data to provide the service: answering your questions, processing your uploads, generating quizzes and flashcards, and personalizing explanations to your learning profile. We do not sell your personal data.",
  },
  {
    title: "Your content is private",
    body: "Your sessions, uploads, quizzes, and flashcards are tied to your account and only accessible to you. Access is enforced per-account on every request.",
  },
  {
    title: "Third-party services",
    body: "We rely on trusted providers to operate — including cloud hosting, authentication, and AI model providers that process your queries to generate responses. These providers process data only to deliver the service.",
  },
  {
    title: "Data retention and deletion",
    body: "Your content is retained while your account is active. Deleting an item removes it and its associated files; deleting your account removes your data.",
  },
];

export default function PrivacyPage() {
  return (
    <SiteLayout>
      <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:py-20">
        <h1 className="text-4xl font-semibold leading-tight tracking-tight">Privacy Policy</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
          How StudyAssistant collects, uses, and protects your data.
        </p>

        <div className="mt-10 space-y-8">
          {SECTIONS.map((section) => (
            <section key={section.title}>
              <h2 className="text-[18px] font-semibold tracking-tight">{section.title}</h2>
              <p className="mt-2 text-[14.5px] leading-relaxed text-muted-foreground">
                {section.body}
              </p>
            </section>
          ))}
          <section>
            <h2 className="text-[18px] font-semibold tracking-tight">Contact</h2>
            <p className="mt-2 text-[14.5px] leading-relaxed text-muted-foreground">
              Questions about privacy? Reach us at{" "}
              <a
                href="mailto:support@studyassistant.in"
                className="text-primary underline-offset-4 hover:underline"
              >
                support@studyassistant.in
              </a>
              .
            </p>
          </section>
        </div>
      </main>
    </SiteLayout>
  );
}

import { Link } from 'react-router-dom';

// Reuses the same brand mark as Login/Signup so the three pages read as one flow.
function BrandMark() {
    return (
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F5EC] ring-1 ring-[#CBE7D4]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                    d="M4 12.5L9.5 18L20 6"
                    stroke="#1F9D63"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M9.5 18c-2.2-.4-3.6-2.6-3-5"
                    stroke="#1F9D63"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    opacity="0.55"
                />
            </svg>
        </div>
    );
}

const SECTIONS = [
    {
        id: 'accounts',
        title: '1. Your account',
        body: [
            "You need an account to save and export resumes. You're responsible for keeping your login details private and for anything that happens under your account.",
            'Tell us right away if you think someone else has access to your account. You must be at least 16 years old to sign up.',
        ],
    },
    {
        id: 'content',
        title: '2. Your resume content',
        body: [
            'Everything you type into a resume — your name, work history, skills, and anything else — stays yours. We never sell it and we never use it to train models without asking first.',
            'We store your content so you can come back and keep editing. You can delete a resume, or your whole account, at any time from your settings.',
        ],
    },
    {
        id: 'acceptable-use',
        title: '3. Acceptable use',
        body: [
            "Use the service to build honest resumes for yourself or people you're authorized to help. Don't use it to impersonate someone else, fabricate credentials, or scrape and resell our templates.",
            'We may suspend accounts that abuse the service, attempt to interfere with it, or violate these terms.',
        ],
    },
    {
        id: 'subscriptions',
        title: '4. Plans and billing',
        body: [
            'Free plans let you build and export a limited number of resumes. Paid plans unlock more templates, exports, and AI suggestions, and renew automatically until you cancel.',
            'You can cancel anytime from billing settings; you keep access through the end of the period you already paid for.',
        ],
    },
    {
        id: 'privacy',
        title: '5. Privacy',
        body: [
            'We collect only what the product needs to work: your account details, resume content, and basic usage data to fix bugs and improve features.',
            "We don't sell your personal data. If you connect a Google account to sign in, we only ever request your name and email.",
        ],
    },
    {
        id: 'changes',
        title: '6. Changes to these terms',
        body: [
            "We'll occasionally update these terms as the product grows. If a change is significant, we'll let you know by email before it takes effect.",
            'Continuing to use the service after a change means you accept the updated terms.',
        ],
    },
];

export default function TermsPage() {
    return (
        <div className="min-h-screen w-full bg-white relative overflow-hidden">
            <div
                className="pointer-events-none absolute -top-32 -right-24 h-80 w-80 rounded-full opacity-50 blur-3xl"
                style={{ background: 'radial-gradient(circle, #E8F5EC 0%, transparent 70%)' }}
            />

            {/* Header */}
            <header className="relative border-b border-[#E7ECE8]">
                <div className="mx-auto max-w-3xl px-6 py-5 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2.5">
                        <BrandMark />
                        <span className="font-extrabold text-[#16241C] tracking-tight">ResumeFresh</span>
                    </Link>
                    <Link
                        to="/signup"
                        className="text-sm font-semibold text-[#1F9D63] hover:underline flex items-center gap-1"
                    >
                        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                        Back to sign up
                    </Link>
                </div>
            </header>

            <main className="relative mx-auto max-w-3xl px-6 py-12 animate-in fade-in slide-in-from-bottom-3 duration-500">
                <h1 className="text-[2rem] leading-tight font-extrabold text-[#16241C] mb-2">
                    Terms &amp; Conditions
                </h1>
                <p className="text-[15px] text-[#5B6B62] mb-10">
                    Last updated August 10, 2026. Plain-language summary — please read in full before you agree.
                </p>

                {/* Quick nav */}
                <nav className="mb-10 rounded-2xl border border-[#E7ECE8] bg-[#F6FAF7] px-5 py-4">
                    <p className="text-[11px] font-semibold text-[#8A968E] uppercase tracking-wider mb-2.5">
                        On this page
                    </p>
                    <ul className="flex flex-wrap gap-x-5 gap-y-1.5">
                        {SECTIONS.map((s) => (
                            <li key={s.id}>
                                <a href={`#${s.id}`} className="text-sm font-medium text-[#1F9D63] hover:underline">
                                    {s.title}
                                </a>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className="space-y-10">
                    {SECTIONS.map((section) => (
                        <section key={section.id} id={section.id} className="scroll-mt-24">
                            <h2 className="text-lg font-bold text-[#16241C] mb-3">{section.title}</h2>
                            <div className="space-y-3">
                                {section.body.map((para, i) => (
                                    <p key={i} className="text-[15px] leading-relaxed text-[#3E4A42]">
                                        {para}
                                    </p>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>

                <div className="mt-12 rounded-2xl border border-[#E7ECE8] bg-[#F6FAF7] px-6 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <p className="text-sm font-semibold text-[#16241C]">Questions about these terms?</p>
                        <p className="text-sm text-[#5B6B62]">Reach us anytime at support@resumefresh.app</p>
                    </div>
                    <Link
                        to="/signup"
                        className="inline-flex items-center justify-center rounded-xl bg-[#1F9D63] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#188252] transition-colors"
                    >
                        I've read it — back to sign up
                    </Link>
                </div>
            </main>
        </div>
    );
}
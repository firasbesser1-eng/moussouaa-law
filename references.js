// =========================================
// الموسوعة القانونية
// نظام عرض المراجع من Supabase
// =========================================

const SUPABASE_URL = "https://yksrckzomkowjzmsafvm.supabase.co";
const SUPABASE_KEY = "sb_publishable_VEa1cABilAnrnclvOTv-IA_yFcn7aIV";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


// =========================================
// جلب المراجع حسب الفرع
// =========================================

async function loadReferences(branchSlug) {

    const container =
        document.getElementById("dynamicReferences");

    if (!container) {
        return;
    }

    container.innerHTML =
        '<div class="loading">⏳ جاري تحميل المراجع...</div>';


    // البحث عن الفرع

    const { data: branch, error: branchError } =
        await supabaseClient
        .from("branches")
        .select("id, name")
        .eq("slug", branchSlug)
        .single();


    if (branchError) {

        container.innerHTML =
            '<div class="error">تعذر العثور على الفرع.</div>';

        console.error(branchError);

        return;
    }


    // جلب المراجع

    const { data: references, error } =
        await supabaseClient
        .from("references")
        .select(`
            id,
            title,
            author,
            description,
            file_path,
            created_at,
            category_id
        `)
        .eq("branch_id", branch.id)
        .order("created_at", {
            ascending: false
        });


    if (error) {

        container.innerHTML =
            '<div class="error">تعذر تحميل المراجع.</div>';

        console.error(error);

        return;
    }


    if (!references || references.length === 0) {

        container.innerHTML =
            `
            <div class="empty">
                📚 لا توجد مراجع مضافة إلى هذا الفرع حاليًا.
            </div>
            `;

        return;
    }


    // إنشاء البطاقات

    container.innerHTML = "";


    for (const reference of references) {

        let categoryName = "";


        if (reference.category_id) {

            const { data: category } =
                await supabaseClient
                .from("reference_categories")
                .select("name")
                .eq("id", reference.category_id)
                .single();

            if (category) {
                categoryName = category.name;
            }
        }


        // رابط PDF

        let pdfUrl = "#";


        if (reference.file_path) {

            const { data } =
                supabaseClient
                .storage
                .from("legal-pdfs")
                .getPublicUrl(
                    reference.file_path
                );

            pdfUrl = data.publicUrl;
        }


        const card =
            document.createElement("div");

        card.className =
            "dynamic-reference-card";


        card.innerHTML = `

            <div class="reference-icon">
                📚
            </div>

            <div class="reference-content">

                <h3>
                    ${escapeHTML(reference.title)}
                </h3>

                ${
                    reference.author
                    ?
                    `<p class="author">
                        ✍️ ${escapeHTML(reference.author)}
                    </p>`
                    :
                    ""
                }

                ${
                    categoryName
                    ?
                    `<span class="category">
                        ${escapeHTML(categoryName)}
                    </span>`
                    :
                    ""
                }

                ${
                    reference.description
                    ?
                    `<p class="description">
                        ${escapeHTML(reference.description)}
                    </p>`
                    :
                    ""
                }

                <div class="reference-buttons">

                    ${
                        reference.file_path
                        ?
                        `
                        <a
                            href="${pdfUrl}"
                            target="_blank"
                            class="button">
                            📄 قراءة PDF
                        </a>

                        <a
                            href="${pdfUrl}"
                            download
                            class="button download">
                            ⬇️ تحميل
                        </a>
                        `
                        :
                        ""
                    }

                </div>

            </div>
        `;


        container.appendChild(card);
    }
}


// =========================================
// حماية النصوص من HTML
// =========================================

function escapeHTML(value) {

    if (!value) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

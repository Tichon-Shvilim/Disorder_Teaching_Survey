import type { CreateQuestionnaireRequest, FormNode, GraphSettings } from './models/FormModels';

/**
 * Complete Hebrew questionnaire data for teaching children with disorders
 * This contains all 13 groups with their respective questions
 */

interface QuestionnaireOption {
  id: string;
  label: string;
  value: number;
}

interface QuestionnaireData {
  id: string;
  type: 'group' | 'question';
  title: string;
  description?: string;
  weight: number;
  graphable: boolean;
  preferredChartType: string;
  children: QuestionnaireData[];
  inputType?: 'single-choice' | 'multiple-choice' | 'scale' | 'number' | 'text';
  required?: boolean;
  options?: QuestionnaireOption[];
}

export const hebrewQuestionnaireData = {
  "title": "שאלון הוראה לילדים עם הפרעות",
  "description": "שאלון מקיף לבחינת שיטות הוראה והתנהגות כלפי ילדים עם הפרעות למידה והתנהגות",
  "structure": [
    {
      "id": "behavioral-aspects",
      "type": "group" as const,
      "title": "היבטים התנהגותיים",
      "description": "שאלות הנוגעות להתנהגות הילד בכיתה",
      "weight": 1,
      "graphable": false,
      "preferredChartType": "bar",
      "children": [
        {
          "id": "behavioral-internal",
          "type": "question" as const,
          "title": "היבטים פנימיים",
          "description": "מידת ביטוי של היבטים פנימיים",
          "weight": 1,
          "required": true,
          "inputType": "single-choice" as const,
          "graphable": true,
          "preferredChartType": "bar",
          "options": [
            { "id": "opt-1", "label": "אינו מזהה רגשות פנימיים", "value": 1 },
            { "id": "opt-2", "label": "מזהה רגשות בקושי קלה", "value": 2 },
            { "id": "opt-3", "label": "מזהה רגשות ברמה טובה", "value": 3 },
            { "id": "opt-4", "label": "מזהה לגמרי רגשות פנימיים", "value": 4 },
            { "id": "opt-5", "label": "מבין מלא של רגשות פנימיים", "value": 5 }
          ],
          "children": []
        }
      ]
    },
    {
      "id": "behavior-emotional-social",
      "type": "group" as const,
      "title": "התנהגות רגשית",
      "description": "היבטים רגשיים וחברתיים",
      "weight": 1,
      "graphable": false,
      "preferredChartType": "bar",
      "children": [
        {
          "id": "emotional-sensitivity",
          "type": "question" as const,
          "title": "רגישות רגשית",
          "description": "מידת הרגישות הרגשית",
          "weight": 1,
          "required": true,
          "inputType": "single-choice" as const,
          "graphable": true,
          "preferredChartType": "bar",
          "options": [
            { "id": "opt-1", "label": "רגישות לברב הביטויים הרגשיים", "value": 1 },
            { "id": "opt-2", "label": "קושי רב בביטויים רגשיים", "value": 2 },
            { "id": "opt-3", "label": "הביטוי רגשי פגוע", "value": 3 },
            { "id": "opt-4", "label": "ביטוי כלל נושא רגש", "value": 4 },
            { "id": "opt-5", "label": "ביטוי נורמלי בכלל נושא", "value": 5 }
          ],
          "children": []
        }
      ]
    },
    {
      "id": "academic-difficulties",
      "type": "group" as const,
      "title": "קושי אקדמי",
      "description": "התנהגויות הקשורות לקושי אקדמי",
      "weight": 1,
      "graphable": false,
      "preferredChartType": "bar",
      "children": [
        {
          "id": "attention-learning",
          "type": "question" as const,
          "title": "חוסר לקשב",
          "description": "מידת חוסר הקשב בלמידה",
          "weight": 1,
          "required": true,
          "inputType": "single-choice" as const,
          "graphable": true,
          "preferredChartType": "bar",
          "options": [
            { "id": "opt-1", "label": "מתמדת עם תלמיד בכלל תחום", "value": 1 },
            { "id": "opt-2", "label": "מתמדת עם תלמיד טוב בכלל", "value": 2 },
            { "id": "opt-3", "label": "מתמדת עם תלמיד במידה", "value": 3 },
            { "id": "opt-4", "label": "מתמדת עם תלמיד עוזר", "value": 4 },
            { "id": "opt-5", "label": "שילוב מלא בכלל מקצועים", "value": 5 }
          ],
          "children": []
        }
      ]
    },
    {
      "id": "mood-difficulties",
      "type": "group" as const,
      "title": "רמת מרץ",
      "description": "קושיים הקשורים לרמת המרץ",
      "weight": 1,
      "graphable": false,
      "preferredChartType": "bar",
      "children": [
        {
          "id": "mood-level",
          "type": "question" as const,
          "title": "רמת חדרון",
          "description": "רמת החדרון והמרץ",
          "weight": 1,
          "required": true,
          "inputType": "single-choice" as const,
          "graphable": true,
          "preferredChartType": "bar",
          "options": [
            { "id": "opt-1", "label": "גמיש לכל קמצי רגש", "value": 1 },
            { "id": "opt-2", "label": "מרדד וחידוד בתקופה", "value": 2 },
            { "id": "opt-3", "label": "מרדד בקנווה במקום", "value": 3 },
            { "id": "opt-4", "label": "מרדד טוב עם כביד", "value": 4 },
            { "id": "opt-5", "label": "מרדד יותר", "value": 5 }
          ],
          "children": []
        }
      ]
    },
    {
      "id": "learning-strategies",
      "type": "group" as const,
      "title": "אסטרטגיות הוראה",
      "description": "שיטות וכלים להוראה",
      "weight": 1,
      "graphable": false,
      "preferredChartType": "bar",
      "children": [
        {
          "id": "teaching-strategies-social",
          "type": "question" as const,
          "title": "התנהגויות סוציואמוציות",
          "description": "שיטות להתמודדות עם התנהגויות סוציואמוציות",
          "weight": 1,
          "required": true,
          "inputType": "single-choice" as const,
          "graphable": true,
          "preferredChartType": "bar",
          "options": [
            { "id": "opt-1", "label": "אין אסטרטגיות כלותיות", "value": 1 },
            { "id": "opt-2", "label": "אסטרטגיות בעצה", "value": 2 },
            { "id": "opt-3", "label": "אסטרטגיות במידה מספקת", "value": 3 },
            { "id": "opt-4", "label": "אסטרטגיות בעצה מספקת", "value": 4 },
            { "id": "opt-5", "label": "גמישה מלאה באסטרטגיות", "value": 5 }
          ],
          "children": []
        }
      ]
    },
    {
      "id": "external-attitudes",
      "type": "group" as const,
      "title": "רגישות חיצונית",
      "description": "יחסים עם הסביבה החיצונית",
      "weight": 1,
      "graphable": false,
      "preferredChartType": "bar",
      "children": [
        {
          "id": "external-sensitivity",
          "type": "question" as const,
          "title": "רגישות חיצונית",
          "description": "מידת הרגישות לגירויים חיצוניים",
          "weight": 1,
          "required": true,
          "inputType": "single-choice" as const,
          "graphable": true,
          "preferredChartType": "bar",
          "options": [
            { "id": "opt-1", "label": "רגמת מלא בכל חיצוני דעת", "value": 1 },
            { "id": "opt-2", "label": "רגמת גבוהה", "value": 2 },
            { "id": "opt-3", "label": "רגמת בינונית", "value": 3 },
            { "id": "opt-4", "label": "רגמת מועטה", "value": 4 },
            { "id": "opt-5", "label": "חלק מלא מחיצוני", "value": 5 }
          ],
          "children": []
        }
      ]
    },
    {
      "id": "social-management",
      "type": "group" as const,
      "title": "ניהול חברון",
      "description": "כישורי ניהול ויחסים חברתיים",
      "weight": 1,
      "graphable": false,
      "preferredChartType": "bar",
      "children": [
        {
          "id": "social-skills",
          "type": "question" as const,
          "title": "ניהול חברון",
          "description": "רמת הכישורים החברתיים",
          "weight": 1,
          "required": true,
          "inputType": "single-choice" as const,
          "graphable": true,
          "preferredChartType": "bar",
          "options": [
            { "id": "opt-1", "label": "ניהול חברון וכבשר", "value": 1 },
            { "id": "opt-2", "label": "ניהול חברון טוב", "value": 2 },
            { "id": "opt-3", "label": "ניהול חברון כמעט חמיה", "value": 3 },
            { "id": "opt-4", "label": "ניהול חברון וכביד חמיה", "value": 4 },
            { "id": "opt-5", "label": "ניהול חברון וכבשר", "value": 5 }
          ],
          "children": []
        }
      ]
    },
    {
      "id": "learning-abilities",
      "type": "group" as const,
      "title": "יכולות למידה",
      "description": "היבטים הקשורים ליכולות הלמידה",
      "weight": 1,
      "graphable": false,
      "preferredChartType": "bar",
      "children": [
        {
          "id": "learning-tempo",
          "type": "question" as const,
          "title": "קווי קצב",
          "description": "קצב הלמידה של התלמיד",
          "weight": 1,
          "required": true,
          "inputType": "single-choice" as const,
          "graphable": true,
          "preferredChartType": "bar",
          "options": [
            { "id": "opt-1", "label": "מהיר ב-5 דקות", "value": 1 },
            { "id": "opt-2", "label": "20-30 דקות", "value": 2 },
            { "id": "opt-3", "label": "10-20 דקות", "value": 3 },
            { "id": "opt-4", "label": "5-10 דקות", "value": 4 },
            { "id": "opt-5", "label": "+30 דקות", "value": 5 }
          ],
          "children": []
        },
        {
          "id": "memory-abilities",
          "type": "question" as const,
          "title": "יכולות זיכרון",
          "description": "יכולות הזיכרון של התלמיד",
          "weight": 1,
          "required": true,
          "inputType": "single-choice" as const,
          "graphable": true,
          "preferredChartType": "bar",
          "options": [
            { "id": "opt-1", "label": "זיכרון מידה בכיסי קרן", "value": 1 },
            { "id": "opt-2", "label": "זיכרון מידה לשינוי עוד", "value": 2 },
            { "id": "opt-3", "label": "זיכרון מידה לשינוי שירה", "value": 3 },
            { "id": "opt-4", "label": "זיכרון מידה בכיסי לגדר", "value": 4 },
            { "id": "opt-5", "label": "זיכרון מידה בכיסי אחר", "value": 5 }
          ],
          "children": []
        }
      ]
    },
    {
      "id": "work-habits",
      "type": "group" as const,
      "title": "הרגלי עבודה",
      "description": "דפוסי עבודה והתנהגות",
      "weight": 1,
      "graphable": false,
      "preferredChartType": "bar",
      "children": [
        {
          "id": "work-patterns",
          "type": "question" as const,
          "title": "מהירות עבודה",
          "description": "קצב וטיב העבודה",
          "weight": 1,
          "required": true,
          "inputType": "single-choice" as const,
          "graphable": true,
          "preferredChartType": "bar",
          "options": [
            { "id": "opt-1", "label": "אטי, ויסדר הסעו חינוךי מדביק", "value": 1 },
            { "id": "opt-2", "label": "מהיר יחסית", "value": 2 },
            { "id": "opt-3", "label": "כמיו וחדוד זכריו אות", "value": 3 },
            { "id": "opt-4", "label": "אטי, ויסדר הסעו חינו", "value": 4 },
            { "id": "opt-5", "label": "אטי בסמוךו ויסדר חלקא", "value": 5 }
          ],
          "children": []
        }
      ]
    },
    {
      "id": "socialization-aspects",
      "type": "group" as const,
      "title": "מוטוריקה",
      "description": "היבטים מוטוריים ושריריים",
      "weight": 1,
      "graphable": false,
      "preferredChartType": "bar",
      "children": [
        {
          "id": "motor-skills",
          "type": "question" as const,
          "title": "מוטוריקה",
          "description": "כישורים מוטוריים",
          "weight": 1,
          "required": true,
          "inputType": "single-choice" as const,
          "graphable": true,
          "preferredChartType": "bar",
          "options": [
            { "id": "opt-1", "label": "מוטוריקה גסה ודיהרכה", "value": 1 },
            { "id": "opt-2", "label": "מוטוריקה טובה ברה", "value": 2 },
            { "id": "opt-3", "label": "מוטוריקה בעיות", "value": 3 },
            { "id": "opt-4", "label": "מוטוריקה בהנתקמת", "value": 4 },
            { "id": "opt-5", "label": "מוטוריקה גסה כמודה", "value": 5 }
          ],
          "children": []
        }
      ]
    },
    {
      "id": "initiative-creativity",
      "type": "group" as const,
      "title": "עצמאות",
      "description": "יכולות עצמאות ויוזמה",
      "weight": 1,
      "graphable": false,
      "preferredChartType": "bar",
      "children": [
        {
          "id": "independence",
          "type": "question" as const,
          "title": "עצמאות",
          "description": "רמת העצמאות של התלמיד",
          "weight": 1,
          "required": true,
          "inputType": "single-choice" as const,
          "graphable": true,
          "preferredChartType": "bar",
          "options": [
            { "id": "opt-1", "label": "רגמת מלא בכל הרחיב נדרש", "value": 1 },
            { "id": "opt-2", "label": "רגמת גבוהה", "value": 2 },
            { "id": "opt-3", "label": "רגמת בינונית", "value": 3 },
            { "id": "opt-4", "label": "רגמת נמוכה", "value": 4 },
            { "id": "opt-5", "label": "ללא מלא עצמאיות", "value": 5 }
          ],
          "children": []
        }
      ]
    },
    {
      "id": "activity-interventions",
      "type": "group" as const,
      "title": "מעבר בין פעילויות",
      "description": "יכולת מעבר והסתגלות",
      "weight": 1,
      "graphable": false,
      "preferredChartType": "bar",
      "children": [
        {
          "id": "activity-transition",
          "type": "question" as const,
          "title": "מעברים בין פעילויות",
          "description": "יכולת מעבר בין פעילויות שונות",
          "weight": 1,
          "required": true,
          "inputType": "single-choice" as const,
          "graphable": true,
          "preferredChartType": "bar",
          "options": [
            { "id": "opt-1", "label": "קושי רב במעברים", "value": 1 },
            { "id": "opt-2", "label": "מתמדת עם כלב פב", "value": 2 },
            { "id": "opt-3", "label": "מתמדת עם מעברים בחמידה", "value": 3 },
            { "id": "opt-4", "label": "מתמדת עם מעברים קלה", "value": 4 },
            { "id": "opt-5", "label": "מעבר נהיר בין פעילויות", "value": 5 }
          ],
          "children": []
        }
      ]
    },
    {
      "id": "personal-attitude",
      "type": "group" as const,
      "title": "הגדרה אישית",
      "description": "יחס אישי והגדרה עצמית",
      "weight": 1,
      "graphable": false,
      "preferredChartType": "bar",
      "children": [
        {
          "id": "self-perception",
          "type": "question" as const,
          "title": "הגדרה אישית",
          "description": "איך התלמיד רואה את עצמו",
          "weight": 1,
          "required": true,
          "inputType": "single-choice" as const,
          "graphable": true,
          "preferredChartType": "bar",
          "options": [
            { "id": "opt-1", "label": "רגמת מלא בהריתי אישיי", "value": 1 },
            { "id": "opt-2", "label": "רגמת גבוהה המדותריה", "value": 2 },
            { "id": "opt-3", "label": "רגמת עצבי בהריתי פיו", "value": 3 },
            { "id": "opt-4", "label": "רגמת עצבי בנכנם מילר", "value": 4 },
            { "id": "opt-5", "label": "ללא עצבי מלא אישיי", "value": 5 }
          ],
          "children": []
        }
      ]
    }
  ],
  "graphSettings": {
    "colorRanges": [
      { "label": "נמוך", "min": 1, "max": 2, "color": "#ef4444" },
      { "label": "בינוני", "min": 3, "max": 3, "color": "#fbbf24" },
      { "label": "גבוה", "min": 4, "max": 5, "color": "#10b981" }
    ]
  }
};

// Convert the JSON structure to proper FormNode format
export const convertToFormNode = (data: QuestionnaireData): FormNode => {
  const node: FormNode = {
    id: data.id,
    type: data.type,
    title: data.title,
    description: data.description,
    weight: data.weight || 1,
    graphable: data.graphable || false,
    preferredChartType: (data.preferredChartType as 'bar' | 'line' | 'radar' | 'gauge' | 'pie') || 'bar',
    children: []
  };

  // Add question-specific properties
  if (data.type === 'question') {
    node.inputType = data.inputType || 'single-choice';
    node.required = data.required || false;
    
    if (data.options && Array.isArray(data.options)) {
      node.options = data.options.map((opt: QuestionnaireOption) => ({
        id: opt.id,
        label: opt.label,
        value: opt.value
      }));
    }
  }

  // Recursively convert children
  if (data.children && Array.isArray(data.children)) {
    node.children = data.children.map(convertToFormNode);
  }

  return node;
};

// Helper function to count questions recursively
export const countQuestions = (nodes: FormNode[]): number => {
  let count = 0;
  for (const node of nodes) {
    if (node.type === 'question') {
      count++;
    }
    if (node.children) {
      count += countQuestions(node.children);
    }
  }
  return count;
};

// Create the questionnaire request
export const createHebrewQuestionnaireRequest = (): CreateQuestionnaireRequest => {
  // Convert the structure
  const structure: FormNode[] = hebrewQuestionnaireData.structure.map(convertToFormNode);

  // Create graph settings
  const graphSettings: GraphSettings = {
    colorRanges: hebrewQuestionnaireData.graphSettings?.colorRanges || [
      { label: "נמוך", min: 1, max: 2, color: "#ef4444" },
      { label: "בינוני", min: 3, max: 3, color: "#fbbf24" },
      { label: "גבוה", min: 4, max: 5, color: "#10b981" }
    ]
  };

  return {
    title: hebrewQuestionnaireData.title,
    description: hebrewQuestionnaireData.description,
    structure,
    graphSettings
  };
};

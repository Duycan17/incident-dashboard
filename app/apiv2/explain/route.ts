import { NextRequest, NextResponse } from 'next/server'
import { API_CONFIG } from '@/lib/config'

interface ExplainRequest {
  text: string
  max_length?: number
  top_k?: number
  return_all?: boolean
}

interface TokenContribution {
  token: string
  value: number
}

interface ExplainResponse {
  prediction: {
    label: string
    confidence: number
    probs: Record<string, number>
  }
  contributions: TokenContribution[]
  note: string
  llm_structured?: {
    explanation?: {
      bullets?: string[]
      summary?: string
    }
    accident_info?: {
      location?: string
      time?: string
      severity_level?: string
      severity_details?: string
    }
  }
  description?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: ExplainRequest = await request.json()
    
    // Validate required fields
    if (!body.text) {
      return NextResponse.json(
        { error: 'Text field is required' },
        { status: 400 }
      )
    }

    // Set defaults for optional fields
    const requestData = {
      text: body.text,
      max_length: body.max_length ?? API_CONFIG.ML.DEFAULT_MAX_LENGTH,
      top_k: API_CONFIG.ML.DEFAULT_TOP_K,
      return_all: API_CONFIG.ML.DEFAULT_RETURN_ALL
    }

    // Make request to the ML explanation service
    const ML_SERVICE_URL = API_CONFIG.UPSTREAM_SERVICES.ML_EXPLAIN
    
    const response = await fetch(ML_SERVICE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    })

    if (!response.ok) {
      throw new Error(`ML service responded with status ${response.status}`)
    }

    const data: ExplainResponse = await response.json()
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in /apiv2/explain:', error)
    
    // Return a mock response for development/demo purposes
    const mockResponse: ExplainResponse = {
      prediction: {
        label: "INCIDENT",
        confidence: 0.942,
        probs: {
          "NOT": 0.058,
          "INCIDENT": 0.942
        }
      },
      contributions: [
        {
          token: "injured",
          value: 0.3693
        },
        {
          token: "train",
          value: 0.2473
        },
        {
          token: "collision",
          value: 0.1263
        },
        {
          token: "near",
          value: 0.1259
        },
        {
          token: "several",
          value: 0.1279
        }
      ],
      note: "Giá trị dương đẩy về lớp dự đoán; âm đẩy ngược lại.",
      description: "Predicted 'INCIDENT' do các từ: injured, train, collision, near, several",
      llm_structured: {
        explanation: {
          bullets: [
            "Mô tả có liên quan đến va chạm và chấn thương.",
            "Các từ khóa như 'injured', 'collision' làm tăng khả năng INCIDENT.",
            "Xác suất rất cao (0.94) cho thấy độ tự tin lớn."
          ],
          summary: "Văn bản mô tả sự cố với chấn thương nên được phân loại là INCIDENT."
        },
        accident_info: {
          location: "central station",
          time: "this morning",
          severity_level: "minor",
          severity_details: "no major damage"
        }
      }
    }
    
    return NextResponse.json(mockResponse)
  }
}

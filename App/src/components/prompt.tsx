"use client"

import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/ui/prompt-input"
import { Button } from "@/components/ui/button"
import { ArrowUp } from "lucide-react"
import { useState } from "react"

interface PromptProps {
  onSendMessage: (content: string) => Promise<void>
  isDisabled?: boolean
}

export function Prompt({ onSendMessage, isDisabled = false }: PromptProps) {
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation()
    }
    
    if (!input.trim() || input.length === 0 || isLoading || isDisabled) return
    
    setIsLoading(true)
    const messageToSend = input.trim()
    setInput("") // Clear input immediately
    
    try {
      await onSendMessage(messageToSend)
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleValueChange = (value: string) => {
    // Limit to 100 characters
    if (value.length <= 100) {
      setInput(value)
    }
  }

  const handleKeyDown = async (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      await handleSubmit()
    }
  }

  return (
    <div className="w-[80%] max-w-(--breakpoint-md) flex flex-col">
      <PromptInput
        value={input}
        onValueChange={handleValueChange}
        isLoading={isLoading}
        className="flex items-center"
      >
        <PromptInputTextarea
          placeholder="Ask me anything..."
          rows={1}
          className="min-h-[44px] flex-1"
          onKeyDown={handleKeyDown}
        />
        <PromptInputActions className="pl-2">
          <PromptInputAction tooltip="Send message">
            <Button
              variant="default"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={handleSubmit}
              disabled={!input.trim() || isLoading || isDisabled}
            >
              <ArrowUp className="size-5" />
            </Button>
          </PromptInputAction>
        </PromptInputActions>
      </PromptInput>
      <div className="flex justify-between items-center px-2 py-1">
        <div className="text-xs text-muted-foreground">
          {input.length}/100 characters
        </div>
        {input.length >= 85 && (
          <div className="text-xs text-orange-500">
            {100 - input.length} characters remaining
          </div>
        )}
      </div>
    </div>
  )
}

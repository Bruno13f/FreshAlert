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

export function Prompt() {
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.stopPropagation()
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
    }, 2000)
  }

  const handleValueChange = (value: string) => {
    setInput(value)
  }

  return (
    <PromptInput
      value={input}
      onValueChange={handleValueChange}
      isLoading={isLoading}
      onSubmit={() => handleSubmit}
      className="w-[80%] max-w-(--breakpoint-md) flex items-center"
    >
      <PromptInputTextarea
        placeholder="Ask me anything..."
        rows={1}
        className="min-h-[44px] flex-1"
      />
      <PromptInputActions className="pl-2">
        <PromptInputAction tooltip="Send message">
          <Button
            variant="default"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => handleSubmit}
          >
            <ArrowUp className="size-5" />
          </Button>
        </PromptInputAction>
      </PromptInputActions>
    </PromptInput>
  )
}

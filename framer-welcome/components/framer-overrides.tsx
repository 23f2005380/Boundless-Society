import { forwardRef, type ComponentType } from "react"

// Learn more: https://www.framer.com/developers/overrides/

export function withRotate(Component: any): ComponentType {
    return forwardRef((props, ref) => {
        return (
            <Component
                ref={ref}
                {...props}
                animate={{ rotate: 90 }}
                transition={{ duration: 2 }}
            />
        )
    })
}

export function withHover(Component: any): ComponentType {
    return forwardRef((props, ref) => {
        return <Component ref={ref} {...props} whileHover={{ scale: 1.05 }} />
    })
}

export function withRandomColor(Component: any): ComponentType {
    return forwardRef((props, ref) => {
        return (
            <Component
                ref={ref}
                {...props}
                animate={{
                    background: "#0099FF",
                }}
                onClick={() => {
                    // Random color functionality can be added here
                }}
            />
        )
    })
} 
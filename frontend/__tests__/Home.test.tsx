import { render, screen } from '@testing-library/react'
import Home from '@/app/page'

// Mock child components to avoid deep rendering issues and dependency chains
jest.mock('@/components/Navbar', () => {
    return function MockNavbar() {
        return <div data-testid="navbar">Navbar</div>
    }
})

jest.mock('@/components/Footer', () => {
    return function MockFooter() {
        return <div data-testid="footer">Footer</div>
    }
})

// Mock Lucide icons to avoid ESM issues
jest.mock('lucide-react', () => ({
    FileText: () => <div data-testid="icon" />,
    ScanLine: () => <div data-testid="icon" />,
    Lock: () => <div data-testid="icon" />,
    Cloud: () => <div data-testid="icon" />,
    Search: () => <div data-testid="icon" />,
    ChevronDown: () => <div data-testid="icon" />,
}))

describe('Home', () => {
    it('renders the home page with main sections', () => {
        render(<Home />)

        // Check for mocked Navbar
        expect(screen.getByTestId('navbar')).toBeInTheDocument()

        // Check for Hero text
        expect(screen.getByText(/The Future of/i)).toBeInTheDocument()
        expect(screen.getByText(/Medical Records/i)).toBeInTheDocument()

        // Check for mocked Footer
        expect(screen.getByTestId('footer')).toBeInTheDocument()
    })
})

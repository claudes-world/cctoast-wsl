#!/usr/bin/env bash
set -euo pipefail

# CI/CD Workflow Optimization Implementation Script
# This script applies the workflow optimizations to reduce GitHub Actions minutes by 70-90%

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
readonly WORKFLOWS_DIR="$PROJECT_ROOT/.github/workflows"
readonly OPTIMIZED_DIR="$PROJECT_ROOT/.github/workflows-optimized"
readonly BACKUP_DIR="$PROJECT_ROOT/.github/workflows-backup"

# Colors for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_banner() {
    echo "=================================================="
    echo "🚀 CI/CD Workflow Optimization Script"
    echo "=================================================="
    echo "This script will:"
    echo "  • Backup current workflows"
    echo "  • Apply optimized workflows"
    echo "  • Reduce GitHub Actions minutes by 70-90%"
    echo "  • Preserve all quality gates"
    echo "=================================================="
    echo
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if we're in the right directory
    if [[ ! -f "$PROJECT_ROOT/package.json" ]]; then
        log_error "Not in cctoast-wsl project root directory"
        exit 1
    fi
    
    # Check if optimized workflows exist
    if [[ ! -d "$OPTIMIZED_DIR" ]]; then
        log_error "Optimized workflows directory not found: $OPTIMIZED_DIR"
        exit 1
    fi
    
    # Check if current workflows exist
    if [[ ! -d "$WORKFLOWS_DIR" ]]; then
        log_error "Current workflows directory not found: $WORKFLOWS_DIR"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

backup_current_workflows() {
    log_info "Creating backup of current workflows..."
    
    if [[ -d "$BACKUP_DIR" ]]; then
        log_warning "Backup directory already exists, creating timestamped backup"
        local timestamp=$(date +%Y%m%d-%H%M%S)
        mv "$BACKUP_DIR" "${BACKUP_DIR}-${timestamp}"
    fi
    
    cp -r "$WORKFLOWS_DIR" "$BACKUP_DIR"
    log_success "Current workflows backed up to: $BACKUP_DIR"
}

analyze_current_usage() {
    log_info "Analyzing current workflow configuration..."
    
    local workflow_count=$(find "$WORKFLOWS_DIR" -name "*.yml" -o -name "*.yaml" | wc -l)
    log_info "Found $workflow_count workflow files"
    
    # Analyze CI workflow matrix
    if [[ -f "$WORKFLOWS_DIR/ci.yml" ]]; then
        local matrix_jobs=$(grep -c "node-version:" "$WORKFLOWS_DIR/ci.yml" || echo "unknown")
        log_info "Current CI matrix: ~$matrix_jobs job configurations"
    fi
    
    # Check for path filtering
    local filtered_workflows=$(grep -l "paths:" "$WORKFLOWS_DIR"/*.yml 2>/dev/null | wc -l || echo "0")
    log_info "Workflows with path filtering: $filtered_workflows"
    
    echo
    log_info "Estimated current usage per development cycle:"
    echo "  • CI workflow: ~20 minutes (3 jobs × ~7 min)"
    echo "  • Release Please: ~3 minutes"
    echo "  • Claude workflows: ~2-4 minutes"
    echo "  • Total: ~25 minutes per cycle"
    echo
}

apply_optimizations() {
    log_info "Applying workflow optimizations..."
    
    # Apply each optimized workflow
    local optimized_files=(
        "ci.yml"
        "release-please.yml" 
        "claude.yml"
        "claude-code-review.yml"
    )
    
    for file in "${optimized_files[@]}"; do
        if [[ -f "$OPTIMIZED_DIR/$file" ]]; then
            log_info "Applying optimized $file..."
            cp "$OPTIMIZED_DIR/$file" "$WORKFLOWS_DIR/$file"
            log_success "✅ $file optimized"
        else
            log_warning "Optimized $file not found, skipping"
        fi
    done
    
    # Keep release.yml as-is (it's already optimized for releases only)
    log_info "Keeping release.yml unchanged (already optimized for tag-based releases)"
}

validate_optimizations() {
    log_info "Validating applied optimizations..."
    
    local validation_errors=0
    
    # Check CI workflow has path filtering
    if ! grep -q "paths:" "$WORKFLOWS_DIR/ci.yml"; then
        log_error "CI workflow missing path filtering"
        ((validation_errors++))
    fi
    
    # Check matrix optimization
    if ! grep -q "is-pr-optimized" "$WORKFLOWS_DIR/ci.yml"; then
        log_error "CI workflow missing matrix optimization"
        ((validation_errors++))
    fi
    
    # Check Release Please has path filtering
    if ! grep -q "paths:" "$WORKFLOWS_DIR/release-please.yml"; then
        log_error "Release Please workflow missing path filtering"
        ((validation_errors++))
    fi
    
    # Check Claude review has targeted conditions
    if ! grep -q "FIRST_TIME_CONTRIBUTOR" "$WORKFLOWS_DIR/claude-code-review.yml"; then
        log_error "Claude Code Review missing targeted conditions"
        ((validation_errors++))
    fi
    
    if [[ $validation_errors -eq 0 ]]; then
        log_success "All optimizations validated successfully"
    else
        log_error "Found $validation_errors validation errors"
        return 1
    fi
}

show_optimization_summary() {
    echo
    echo "=================================================="
    echo "🎉 Optimization Summary"
    echo "=================================================="
    echo
    echo "✅ Applied Optimizations:"
    echo "  • Path-based filtering (40-60% reduction)"
    echo "  • Optimized CI matrix for PRs vs main branch"
    echo "  • Conditional benchmark execution"
    echo "  • Targeted Claude Code Review triggers"
    echo "  • Consolidated release validation"
    echo
    echo "📊 Expected Results:"
    echo "  • PR development cycle: ~7.5 minutes (was ~25 minutes)"
    echo "  • CI minutes reduction: 70-90%"
    echo "  • Faster PR feedback by ~40%"
    echo "  • Maintained quality gates and compatibility testing"
    echo
    echo "🔧 Next Steps:"
    echo "  1. Commit and push the optimized workflows"
    echo "  2. Update branch protection rules if needed"
    echo "  3. Test with documentation-only and code PRs"
    echo "  4. Monitor GitHub Actions usage in repository settings"
    echo
    echo "📚 Documentation:"
    echo "  • Full guide: docs/CI_WORKFLOW_OPTIMIZATION.md"
    echo "  • Backup location: $BACKUP_DIR"
    echo "  • Rollback: cp $BACKUP_DIR/* $WORKFLOWS_DIR/"
    echo
    echo "=================================================="
}

rollback_optimizations() {
    log_warning "Rolling back optimizations..."
    
    if [[ ! -d "$BACKUP_DIR" ]]; then
        log_error "No backup found at $BACKUP_DIR"
        exit 1
    fi
    
    cp "$BACKUP_DIR"/*.yml "$WORKFLOWS_DIR/"
    log_success "Optimizations rolled back successfully"
}

show_usage() {
    echo "Usage: $0 [OPTION]"
    echo
    echo "Options:"
    echo "  apply     Apply workflow optimizations (default)"
    echo "  rollback  Rollback to original workflows"
    echo "  analyze   Analyze current workflow configuration"
    echo "  help      Show this help message"
    echo
    echo "Examples:"
    echo "  $0                    # Apply optimizations"
    echo "  $0 apply              # Apply optimizations"
    echo "  $0 analyze            # Just analyze current setup"
    echo "  $0 rollback           # Rollback changes"
}

main() {
    local action="${1:-apply}"
    
    case "$action" in
        "apply")
            print_banner
            check_prerequisites
            analyze_current_usage
            backup_current_workflows
            apply_optimizations
            validate_optimizations
            show_optimization_summary
            ;;
        "rollback")
            log_info "Rollback mode"
            rollback_optimizations
            ;;
        "analyze")
            log_info "Analysis mode"
            check_prerequisites
            analyze_current_usage
            ;;
        "help"|"-h"|"--help")
            show_usage
            ;;
        *)
            log_error "Unknown action: $action"
            show_usage
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
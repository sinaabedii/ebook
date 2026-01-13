"""
Background task manager for handling async operations without Celery.
"""
from __future__ import annotations

import logging
import threading
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Callable, Dict, Optional

logger = logging.getLogger(__name__)


class TaskStatus(Enum):
    """Status of a background task."""
    PENDING = 'pending'
    RUNNING = 'running'
    COMPLETED = 'completed'
    FAILED = 'failed'


@dataclass
class Task:
    """Represents a background task."""
    id: str
    name: str
    status: TaskStatus = TaskStatus.PENDING
    created_at: datetime = field(default_factory=datetime.now)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error: Optional[str] = None
    result: Any = None


class BackgroundTaskManager:
    """
    Thread-based background task manager.

    A lightweight alternative to Celery for development and small deployments.
    Uses singleton pattern to ensure one task manager instance.
    """

    _instance: Optional[BackgroundTaskManager] = None
    _lock = threading.Lock()

    def __new__(cls, max_workers: int = 4) -> BackgroundTaskManager:
        """Singleton pattern to ensure one task manager."""
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialized = False
        return cls._instance

    def __init__(self, max_workers: int = 4) -> None:
        """Initialize the task manager."""
        if self._initialized:
            return

        self._executor = ThreadPoolExecutor(max_workers=max_workers)
        self._tasks: Dict[str, Task] = {}
        self._task_counter = 0
        self._initialized = True
        logger.info(f"BackgroundTaskManager initialized with {max_workers} workers")

    def _generate_task_id(self) -> str:
        """Generate unique task ID."""
        with self._lock:
            self._task_counter += 1
            timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
            return f"task_{self._task_counter}_{timestamp}"

    def submit(
        self,
        func: Callable,
        *args,
        task_name: Optional[str] = None,
        **kwargs
    ) -> str:
        """
        Submit a task for background execution.

        Args:
            func: Function to execute
            *args: Positional arguments for the function
            task_name: Optional name for the task
            **kwargs: Keyword arguments for the function

        Returns:
            Task ID string
        """
        task_id = self._generate_task_id()
        task = Task(
            id=task_id,
            name=task_name or func.__name__,
        )
        self._tasks[task_id] = task

        def wrapper():
            task.status = TaskStatus.RUNNING
            task.started_at = datetime.now()

            try:
                result = func(*args, **kwargs)
                task.result = result
                task.status = TaskStatus.COMPLETED
                logger.info(f"Task {task_id} ({task.name}) completed successfully")
            except Exception as e:
                task.error = str(e)
                task.status = TaskStatus.FAILED
                logger.error(f"Task {task_id} ({task.name}) failed: {e}")
            finally:
                task.completed_at = datetime.now()

        self._executor.submit(wrapper)
        logger.info(f"Task {task_id} ({task.name}) submitted")

        return task_id

    def get_task_status(self, task_id: str) -> Optional[Task]:
        """Get task by ID."""
        return self._tasks.get(task_id)

    def cleanup_old_tasks(self, max_age_hours: int = 24) -> int:
        """
        Remove completed tasks older than max_age_hours.

        Returns:
            Number of tasks removed
        """
        cutoff = datetime.now() - timedelta(hours=max_age_hours)
        to_remove = [
            task_id for task_id, task in self._tasks.items()
            if task.completed_at and task.completed_at < cutoff
        ]

        for task_id in to_remove:
            del self._tasks[task_id]

        if to_remove:
            logger.info(f"Cleaned up {len(to_remove)} old tasks")

        return len(to_remove)


# Global instance
_task_manager: Optional[BackgroundTaskManager] = None


def get_task_manager() -> BackgroundTaskManager:
    """Get or create the global task manager instance."""
    global _task_manager
    if _task_manager is None:
        _task_manager = BackgroundTaskManager()
    return _task_manager


def run_in_background(func: Callable, *args, **kwargs) -> str:
    """
    Convenience function to run a task in background.

    Args:
        func: Function to execute
        *args: Arguments for the function
        **kwargs: Keyword arguments for the function

    Returns:
        Task ID string
    """
    return get_task_manager().submit(func, *args, **kwargs)
